const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const Ajv = require('ajv');
const { categorySlug } = require('../../src/content/categories');

const root = path.resolve(__dirname, '../..');
const contentDir = path.join(root, 'content');
const schema = require('../../content/schemas/content.schema.json');
const ajv = new Ajv({ allErrors: true, jsonPointers: true });
ajv.addSchema(schema, 'content');

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function readJson(file, kind) {
  try {
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const value = JSON.parse(text);
    // JSON.parse checks strict syntax; YAML's JSON-compatible parser also catches
    // duplicate keys, which JSON.parse would silently overwrite.
    const document = YAML.parseDocument(text, { uniqueKeys: true });
    if (document.errors.length) throw document.errors[0];
    const validate = ajv.getSchema(`content#/definitions/${kind}`);
    if (!validate(value))
      throw new Error(
        validate.errors
          .map(
            error =>
              `${kind}${error.dataPath}${
                error.params.additionalProperty
                  ? '/' + error.params.additionalProperty
                  : ''
              } ${error.message}`,
          )
          .join('; '),
      );
    return value;
  } catch (error) {
    fail(file, error.message);
  }
}

function unique(values, file, field) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail(file, `Duplicate ${field}: ${value}`);
    seen.add(value);
  }
}

function asset(url, file, publicDir, required = true) {
  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch (_) {
    fail(file, `Invalid asset URL: ${url}`);
  }
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    /[\\?#\x00-\x1f]/.test(decoded) ||
    decoded.split('/').some(part => part === '..' || part === '.')
  )
    fail(file, `Unsafe public asset path: ${url}`);
  const resolved = path.resolve(publicDir, `.${decoded}`);
  if (!resolved.startsWith(path.resolve(publicDir) + path.sep))
    fail(file, `Asset must stay inside public/: ${url}`);
  if (required && (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()))
    fail(file, `Missing public asset: ${url}`);
}

function readSources(
  directory = contentDir,
  publicDir = path.join(root, 'public'),
) {
  const files = new Map();
  const load = (filename, kind) => {
    const file = path.join(directory, filename);
    const value = readJson(file, kind);
    files.set(value, file);
    return value;
  };
  const collection = (name, key) => {
    const all = fs
      .readdirSync(path.join(directory, name))
      .filter(file => file.endsWith('.json'))
      .sort()
      .map(file =>
        load(`${name}/${file}`, name === 'notes' ? 'note' : 'release'),
      );
    const ids = new Set();
    for (const item of all) {
      if (!item[key]) continue;
      if (ids.has(item[key]))
        fail(files.get(item), `Duplicate ${key}: ${item[key]}`);
      ids.add(item[key]);
    }
    return all
      .filter(item => item.status === 'published')
      .sort(
        (a, b) =>
          (a.order == null ? Infinity : a.order) -
          (b.order == null ? Infinity : b.order),
      );
  };
  const settings = load('site.json', 'site');
  const links = load('links.json', 'links');
  const navigation = load('navigation.json', 'navigation');
  const home = load('home.json', 'home');
  const playlist = load('playlist.json', 'playlist');
  const videos = load('videos.json', 'videos');
  const artwork = load('artwork.json', 'artwork');
  const notes = collection('notes', 'id');
  const releaseRecords = collection('releases', 'slug');
  const fileOf = item => files.get(item) || directory;
  unique(
    videos.map(video => video.id),
    fileOf(videos),
    'video id',
  );
  unique(
    home.items.map(item => item.id),
    fileOf(home),
    'homepage item id',
  );
  unique(home.featuredReleaseIds, fileOf(home), 'featured release');
  unique(
    navigation.map(item => item.path),
    fileOf(navigation),
    'navigation path',
  );
  unique(
    settings.profile.socialLinks.map(item => item.id),
    fileOf(settings),
    'social id',
  );
  unique(settings.sidebar.socialIds, fileOf(settings), 'sidebar social id');
  asset(settings.profile.avatarSrc, fileOf(settings), publicDir);
  for (const [id, entry] of Object.entries(artwork)) {
    if (/[\\/]/.test(entry.source) || entry.source === '..')
      fail(fileOf(artwork), `Invalid artwork source filename: ${id}`);
    asset(entry.url, fileOf(artwork), publicDir);
  }
  const socialLinks = {};
  for (const social of settings.profile.socialLinks) {
    if (!links[social.linkId])
      fail(fileOf(settings), `Unknown social link: ${social.linkId}`);
    socialLinks[social.id] = links[social.linkId].url;
  }
  for (const id of settings.sidebar.socialIds) {
    if (!socialLinks[id])
      fail(fileOf(settings), `Unknown sidebar social: ${id}`);
    if (!['youtube', 'instagram', 'spotify', 'tiktok'].includes(id))
      fail(fileOf(settings), `Unknown social icon: ${id}`);
  }
  if (!notes.some(note => note.id === settings.defaultNoteId))
    fail(
      fileOf(settings),
      `Unknown public defaultNoteId: ${settings.defaultNoteId}`,
    );
  for (const note of notes) {
    for (const section of note.sections.sections)
      unique(
        section.items.map(item => item.id),
        fileOf(note),
        'note item id',
      );
  }
  const releases = releaseRecords.map(record => {
    const release = Object.assign({}, record);
    const video = id => {
      const found = videos.find(item => item.id === id);
      if (!found) fail(fileOf(record), `Unknown videoId: ${id}`);
      return found;
    };
    if (record.artworkId && !artwork[record.artworkId])
      fail(fileOf(record), `Unknown artworkId: ${record.artworkId}`);
    if (record.trackUrl)
      asset(record.trackUrl, fileOf(record), publicDir, false);
    if (
      record.releaseDate &&
      new Date(record.releaseDate).toISOString().slice(0, 10) !==
        record.releaseDate
    )
      fail(fileOf(record), 'releaseDate needs a real calendar date');
    release.artwork = record.artworkId ? artwork[record.artworkId].url : null;
    release.video = record.videoId ? video(record.videoId) : null;
    if (record.alternateVideoIds && record.alternateVideoIds.length)
      release.alternateVideos = record.alternateVideoIds.map(video);
    release.downloads = record.downloads || [];
    // Existing ancillary tools consume this field; editable source uses downloads.
    release.guitarHeroUrl = (release.downloads[0] || {}).url;
    files.set(release, fileOf(record));
    return release;
  });
  const tracks = playlist.map(entry => {
    if (entry.releaseId) {
      const release = releases.find(item => item.slug === entry.releaseId);
      if (!release || !release.trackUrl)
        fail(
          fileOf(playlist),
          `Unknown or unplayable releaseId: ${entry.releaseId}`,
        );
    } else {
      asset(entry.trackUrl, fileOf(playlist), publicDir, false);
      if (!artwork[entry.artworkId])
        fail(fileOf(playlist), `Unknown artworkId: ${entry.artworkId}`);
    }
    return entry;
  });
  unique(
    tracks.map(item => item.releaseId || item.id),
    fileOf(playlist),
    'playlist entry',
  );
  return {
    settings,
    links,
    navigation,
    home,
    playlist,
    videos,
    artwork,
    notes,
    releases,
    profile: Object.assign({}, settings.profile, { socialLinks }),
    videoById: id => videos.find(video => video.id === id),
    fileOf,
    publicDir,
  };
}

function completeContent(data, posts) {
  const { notes, releases, settings, home, fileOf } = data;
  const releasePosts = new Map();
  const paths = new Set(['/', '/blog', '/music', '/notes']);
  const addPath = (url, file) => {
    if (paths.has(url)) fail(file, `Duplicate public path: ${url}`);
    paths.add(url);
  };
  posts.forEach(post => {
    addPath(post.path, `posts/${post.slug}.md`);
    if (post.releaseId) {
      if (releasePosts.has(post.releaseId))
        fail(
          `posts/${post.slug}.md`,
          `Duplicate canonical releaseId: ${post.releaseId}`,
        );
      releasePosts.set(post.releaseId, post);
    }
  });
  notes.forEach(note => addPath(note.path, fileOf(note)));
  const categories = new Set(posts.map(post => categorySlug(post.type)));
  categories.forEach(category =>
    addPath(`/blog/category/${category}`, 'categories'),
  );
  for (let number = 2; number <= Math.ceil(posts.length / 6); number++)
    addPath(`/blog/page/${number}`, 'pagination');
  releases.forEach(release => {
    const post = releasePosts.get(release.slug);
    if (post) {
      addPath(release.path, fileOf(release));
      release.articlePath = post.path;
    }
  });
  const resolve = (target, file) => {
    let url;
    let external = false;
    switch (target.type) {
      case 'external':
        url = target.url;
        external = true;
        break;
      case 'link':
        url = (data.links[target.id] || {}).url;
        external = true;
        break;
      case 'note':
        url = (notes.find(note => note.id === target.id) || {}).path;
        break;
      case 'post':
        url = (posts.find(post => post.id === target.id) || {}).path;
        break;
      case 'release':
        url = (releasePosts.get(target.id) || {}).path;
        break;
      case 'page': {
        const parsed = new URL(target.path, settings.siteUrl);
        if (
          parsed.origin !== new URL(settings.siteUrl).origin ||
          !paths.has(parsed.pathname)
        )
          fail(file, `Unknown internal page: ${target.path}`);
        url = target.path;
        break;
      }
      case 'action':
        url = target.action === 'winamp' ? '/music' : settings.newsletterUrl;
        external = target.action === 'newsletter';
        break;
      default:
        fail(file, `Unknown target type: ${target.type}`);
    }
    if (!url) fail(file, `Unknown ${target.type} target: ${target.id}`);
    return { url, external };
  };
  const compiledNotes = notes.map(note =>
    Object.assign({}, note, {
      desktopIconTitle: note.desktopIconTitle || note.title,
      sections: Object.assign({}, note.sections, {
        sections: note.sections.sections.map(section =>
          Object.assign({}, section, {
            items: section.items.map(item => {
              const destination = resolve(item.target, fileOf(note));
              return Object.assign({}, item, {
                url: destination.url,
                type: destination.external ? 'external' : 'action',
                action: item.analyticsAction,
              });
            }),
          }),
        ),
      }),
    }),
  );
  for (const entry of data.navigation)
    resolve({ type: 'page', path: entry.path }, 'navigation.json');
  for (const entry of home.items)
    if (entry.target) resolve(entry.target, 'home.json');
  const featuredReleases = home.featuredReleaseIds.map(id => {
    const release = releases.find(item => item.slug === id);
    if (!release || !release.articlePath)
      fail('home.json', `Featured release needs a published article: ${id}`);
    return release;
  });
  const homeItems = [];
  home.items.forEach(entry => {
    if (entry.type === 'featuredReleases') {
      featuredReleases.forEach((release, index) =>
        homeItems.push({
          id: `release-${release.slug}`,
          title: `${data.profile.name} - ${release.title}`,
          subtitle: release.listeningLabel,
          url: release.listeningUrl,
          external: true,
          analyticsEvent: 'music_listen_click',
          releaseSlug: release.slug,
          highlight: index === 0,
        }),
      );
    } else if (entry.type === 'notes') {
      compiledNotes
        .filter(note => note.homepage !== false)
        .forEach(note =>
          homeItems.push({
            id: `note-${note.id}`,
            title: note.title,
            subtitle: entry.subtitle,
            icon: entry.icon,
            target: { type: 'note', id: note.id },
            url: note.path,
            external: false,
          }),
        );
    } else
      homeItems.push(
        Object.assign({}, entry, resolve(entry.target, 'home.json')),
      );
  });
  // Validate Markdown destinations from compiled HTML, not fenced/inline examples.
  for (const post of posts) {
    const file = `posts/${post.slug}.md`;
    for (const match of post.bodyHtml.matchAll(
      /<(a|img)\b[^>]*?\b(?:href|src)="([^"]*)"/g,
    )) {
      const url = match[2].replace(/&amp;/g, '&');
      if (url.startsWith('#') || /^https?:\/\//i.test(url)) continue;
      if (!url.startsWith('/') || url.startsWith('//'))
        fail(file, `Invalid content URL: ${url}`);
      const parsed = new URL(url, settings.siteUrl);
      if (match[1] === 'a' && paths.has(parsed.pathname)) continue;
      asset(parsed.pathname, file, data.publicDir);
    }
  }
  return {
    siteUrl: settings.siteUrl,
    profile: data.profile,
    settings,
    navigation: data.navigation,
    home: Object.assign({}, home, { items: homeItems }),
    notes: compiledNotes,
    releases,
    videos: data.videos,
    artwork: data.artwork,
    playlist: data.playlist,
    posts,
  };
}

module.exports = { readSources, completeContent, readJson, contentDir, asset };
