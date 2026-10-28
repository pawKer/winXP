const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const MarkdownIt = require('markdown-it');

const root = path.resolve(__dirname, '../..');
const sourceDir = path.join(root, 'content/posts');
const outputFile = path.join(root, 'src/content/generated/posts.json');
const { categorySlug } = require('../../src/content/categories');
const markdown = new MarkdownIt({ html: false, linkify: false });
markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  const href = token.attrGet('href') || '';
  if (/^(https?:)?\/\//i.test(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  } else if (
    href &&
    !href.startsWith('/') &&
    !href.startsWith('#') &&
    !/^[a-z][a-z\d+.-]*:/i.test(href)
  ) {
    throw new Error(`Use a root-relative link instead of "${href}"`);
  }
  return renderer.renderToken(tokens, index, options);
};

function references() {
  // Reload reference data for the development watcher without loading the page registry.
  for (const name of [
    'site',
    'catalogue',
    'noteSections',
    'videos.json',
    'audioManifest.json',
    'artwork.json',
  ]) {
    delete require.cache[require.resolve(`../../src/content/${name}`)];
  }
  const { releases, notes } = require('../../src/content/site');
  const { videoById } = require('../../src/content/catalogue');
  return { releases, notes, videoById };
}

function parsePost(text, filename, refs) {
  const match = text
    .replace(/^\uFEFF/, '')
    .match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match)
    throw new Error('Start the file with a YAML header between --- lines');
  const document = YAML.parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) throw document.errors[0];
  const meta = document.toJS({ maxAliasCount: 50 });
  if (!meta || typeof meta !== 'object' || Array.isArray(meta))
    throw new Error('The header must be a mapping');
  const status = meta.status || 'draft';
  if (!['draft', 'published'].includes(status))
    throw new Error('status must be draft or published');
  if (status === 'draft') return null;
  const slug = path.basename(filename, '.md');
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    ['page', 'category'].includes(slug)
  )
    throw new Error(
      'Use a lowercase, hyphenated filename (page and category are reserved)',
    );
  const allowed = [
    'id',
    'title',
    'excerpt',
    'category',
    'status',
    'publishedAt',
    'dateSource',
    'updatedAt',
    'author',
    'language',
    'releaseId',
    'videoId',
    'extraVideoIds',
    'noteIds',
    'topics',
    'sourceUrl',
    'provenance',
    'chapters',
  ];
  for (const key of Object.keys(meta))
    if (!allowed.includes(key)) throw new Error(`Unknown header field: ${key}`);
  for (const key of ['title', 'excerpt', 'category'])
    if (typeof meta[key] !== 'string' || !meta[key].trim())
      throw new Error(`${key} is required`);
  for (const key of [
    'id',
    'author',
    'language',
    'provenance',
    'sourceUrl',
    'videoId',
    'releaseId',
  ])
    if (meta[key] != null && typeof meta[key] !== 'string')
      throw new Error(`${key} must be text`);
  if (!categorySlug(meta.category))
    throw new Error('category needs at least one letter or number');
  for (const key of ['extraVideoIds', 'noteIds', 'topics'])
    if (
      meta[key] &&
      (!Array.isArray(meta[key]) ||
        meta[key].some(value => typeof value !== 'string'))
    )
      throw new Error(`${key} must be a list of strings`);
  const video = meta.videoId && refs.videoById(meta.videoId);
  if (meta.videoId && !video)
    throw new Error(`Unknown videoId: ${meta.videoId}`);
  for (const id of meta.extraVideoIds || [])
    if (!refs.videoById(id))
      throw new Error(`Unknown extraVideoIds entry: ${id}`);
  for (const id of meta.noteIds || [])
    if (!refs.notes.some(note => note.id === id))
      throw new Error(`Unknown noteIds entry: ${id}`);
  if (
    meta.releaseId &&
    !refs.releases.some(release => release.slug === meta.releaseId)
  )
    throw new Error(`Unknown releaseId: ${meta.releaseId}`);
  const dateSource = meta.dateSource || (video ? 'video' : 'article');
  if (
    !['video', 'article'].includes(dateSource) ||
    (dateSource === 'video' && !video)
  )
    throw new Error('dateSource must be article, or video with a videoId');
  const publishedAt =
    dateSource === 'video' ? video.publishedAt : meta.publishedAt;
  for (const [key, value] of Object.entries({
    publishedAt,
    updatedAt: meta.updatedAt,
  })) {
    if (key === 'updatedAt' && value == null) continue;
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2}))?$/.test(
        value,
      ) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value.slice(0, 10)).toISOString().slice(0, 10) !==
        value.slice(0, 10)
    )
      throw new Error(`${key} needs an ISO date or timestamp`);
  }
  if (meta.updatedAt && meta.updatedAt.slice(0, 10) < publishedAt.slice(0, 10))
    throw new Error('updatedAt must not precede publishedAt');
  if (meta.sourceUrl && !/^https?:\/\//i.test(meta.sourceUrl))
    throw new Error('sourceUrl needs an http(s) URL');
  if (
    meta.chapters &&
    (!video ||
      !Array.isArray(meta.chapters) ||
      meta.chapters.some(
        chapter =>
          !Array.isArray(chapter) ||
          chapter.length !== 2 ||
          !Number.isInteger(chapter[0]) ||
          chapter[0] < 0 ||
          typeof chapter[1] !== 'string',
      ))
  )
    throw new Error('chapters needs a videoId and [seconds, label] pairs');
  if (!match[2].trim())
    throw new Error('A published post needs a Markdown body');
  const tokens = markdown.parse(match[2], {});
  if (tokens.some(token => token.type === 'heading_open' && token.tag === 'h1'))
    throw new Error(
      'Use ## for body headings; the template supplies the page title',
    );
  return {
    ...meta,
    slug,
    path: `/blog/${slug}`,
    id: meta.id || slug,
    type: meta.category,
    status,
    publishedAt,
    dateSource,
    author: meta.author || 'reshra',
    language: meta.language || 'en',
    sourceUrl: meta.sourceUrl || (video && video.sourceUrl) || null,
    bodyHtml: markdown.renderer.render(tokens, markdown.options, {}),
  };
}

function compilePosts(directory = sourceDir, refs = references()) {
  const posts = [];
  const ids = new Set();
  const categories = new Map();
  for (const file of fs
    .readdirSync(directory)
    .filter(file => file.endsWith('.md'))
    .sort()) {
    try {
      const post = parsePost(
        fs.readFileSync(path.join(directory, file), 'utf8'),
        file,
        refs,
      );
      if (!post) continue;
      if (ids.has(post.id)) throw new Error(`Duplicate post id: ${post.id}`);
      ids.add(post.id);
      const key = categorySlug(post.type);
      if (categories.has(key) && categories.get(key) !== post.type)
        throw new Error(`Category URL collision: ${post.type}`);
      categories.set(key, post.type);
      posts.push(post);
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  }
  return posts;
}

function buildContent() {
  const posts = compilePosts();
  const json = JSON.stringify(posts, null, 2) + '\n';
  if (
    !fs.existsSync(outputFile) ||
    fs.readFileSync(outputFile, 'utf8') !== json
  ) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, json);
    return true;
  }
  return false;
}

if (require.main === module) {
  buildContent();
  console.log('Compiled published Markdown posts');
}
module.exports = {
  buildContent,
  compilePosts,
  parsePost,
  sourceDir,
  categorySlug,
};
