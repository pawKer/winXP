const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { compileContent, buildContent } = require('./build.cjs');
const { contentDir } = require('./sources.cjs');
const { watchContent } = require('./watch.cjs');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'winxp-data-test-'));
  fs.cpSync(contentDir, directory, { recursive: true });
  t.after(() => {
    assert.ok(directory.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const write = (file, data) =>
    fs.writeFileSync(path.join(directory, file), JSON.stringify(data, null, 2));
  const read = file =>
    JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  return { directory, write, read, compile: () => compileContent(directory) };
}

test('Data-only authoring discovers notes, links, posts, recordings and public WIP tracks', t => {
  const f = fixture(t);
  f.write('notes/new-resource.json', {
    id: 'newResource',
    path: '/notes/new-resource',
    title: 'New Resource.txt',
    description: 'Useful resources.',
    status: 'published',
    sections: {
      sections: [
        {
          title: 'Related',
          items: [
            {
              id: 'song',
              target: { type: 'release', id: 'new-song' },
              displayText: 'New song',
            },
          ],
        },
      ],
    },
  });
  const release = {
    slug: 'new-song',
    path: '/music/new-song',
    title: 'New song',
    description: 'A recording.',
    status: 'published',
    releaseStatus: 'released',
    duration: 120,
    credits: [],
    listeningUrl: 'https://example.com/song',
    listeningLabel: 'Listen',
  };
  f.write('releases/new-song.json', release);
  fs.writeFileSync(
    path.join(f.directory, 'posts/new-song.md'),
    '---\ntitle: New song\nexcerpt: A new recording.\ncategory: Studio Diary\nstatus: published\npublishedAt: "2026-10-30"\nreleaseId: new-song\nnoteIds: [newResource]\n---\n\n## New recording\n\n[Resources](/notes/new-resource)',
  );
  const home = f.read('home.json');
  home.items.push({
    id: 'new-song',
    title: 'New song',
    target: { type: 'release', id: 'new-song' },
  });
  home.items.push({
    id: 'external',
    title: 'External',
    target: { type: 'external', url: 'https://example.com' },
  });
  home.items.push({
    id: 'root',
    title: 'Home',
    target: { type: 'page', path: '/' },
  });
  f.write('home.json', home);
  const playlist = f.read('playlist.json');
  playlist.push({
    id: 'public-wip',
    title: 'Public work in progress',
    artist: 'reshra',
    trackUrl: '/songs/not-installed.wav',
    duration: 10,
    artworkId: 'drafts',
  });
  f.write('playlist.json', playlist);
  const data = f.compile();
  assert.equal(data.notes.at(-1).id, 'newResource');
  assert.ok(data.home.items.some(item => item.target?.id === 'newResource'));
  assert.equal(
    data.home.items.find(item => item.id === 'new-song').url,
    '/blog/new-song',
  );
  assert.equal(data.home.items.find(item => item.id === 'root').url, '/');
  assert.equal(
    data.notes.at(-1).sections.sections[0].items[0].url,
    '/blog/new-song',
  );
  assert.equal(
    data.releases.find(item => item.slug === 'new-song').articlePath,
    '/blog/new-song',
  );
  assert.equal(data.playlist.at(-1).id, 'public-wip');
  // Load this compiled fixture through the actual route/render adapters in a fresh process.
  const code = `const fs = require('fs'); const assert = require('assert');
    const filename = require.resolve('./src/content/generated/content.json');
    require.cache[filename] = { exports: JSON.parse(fs.readFileSync(0, 'utf8')) };
    const {getPage,renderContent} = require('./src/content/pages');
    assert.equal(getPage('/music/new-song').path, '/blog/new-song');
    assert.ok(getPage('/blog/category/studio-diary'));
    assert.ok(renderContent(getPage('/music')).includes('href="/blog/new-song"'));
    assert.ok(!renderContent(getPage('/blog/new-song')).includes('data-play-desktop='));
    assert.ok(renderContent(getPage('/notes/new-resource')).includes('New Resource.txt'));`;
  const result = spawnSync(process.execPath, ['-e', code], {
    cwd: path.resolve(__dirname, '../..'),
    input: JSON.stringify(data),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
});

test('Editorial drafts never enter the snapshot or satisfy public references', t => {
  const f = fixture(t);
  f.write('notes/private.json', {
    status: 'draft',
    id: 'privateNote',
    title: 'PRIVATE NOTE',
  });
  f.write('releases/private.json', {
    status: 'draft',
    slug: 'private-song',
    title: 'PRIVATE SONG',
  });
  fs.writeFileSync(
    path.join(f.directory, 'posts/private.md'),
    '---\nstatus: draft\n---\nPRIVATE ARTICLE',
  );
  assert.ok(!JSON.stringify(f.compile()).includes('PRIVATE'));
  const home = f.read('home.json');
  home.items.push({
    id: 'private',
    title: 'Private',
    target: { type: 'note', id: 'privateNote' },
  });
  f.write('home.json', home);
  assert.throws(f.compile, /home.json: Unknown note target: privateNote/);
});

test('Schema errors, duplicate JSON keys, IDs and canonical articles fail with source context', t => {
  const f = fixture(t);
  const file = 'notes/thank-you.json';
  const note = f.read(file);
  f.write(file, Object.assign({}, note, { unexpected: true }));
  assert.throws(f.compile, /thank-you.json:.*unexpected/);
  fs.writeFileSync(
    path.join(f.directory, file),
    '{"status":"draft","status":"published"}',
  );
  assert.throws(f.compile, /thank-you.json:.*unique/i);
  f.write(file, note);
  f.write('notes/duplicate.json', note);
  assert.throws(f.compile, /Duplicate id/);
  fs.unlinkSync(path.join(f.directory, 'notes/duplicate.json'));
  const post = fs.readFileSync(
    path.join(f.directory, 'posts/forever.md'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(f.directory, 'posts/duplicate.md'),
    post.replace(/^id:.*$/m, 'id: duplicate-article'),
  );
  assert.throws(f.compile, /Duplicate canonical releaseId/);
});

test('Invalid targets, media, dates and Markdown links fail; absent audio is allowed', t => {
  const f = fixture(t);
  const file = 'notes/thank-you.json';
  const note = f.read(file);
  for (const target of [
    { type: 'action', action: 'execute' },
    { type: 'external', url: 'javascript:alert(1)' },
    { type: 'page', path: '/missing-page' },
    { type: 'note', id: 'missing' },
  ]) {
    const changed = structuredClone(note);
    changed.sections.sections[0].items[0].target = target;
    f.write(file, changed);
    assert.throws(f.compile, /thank-you.json:/);
  }
  f.write(file, note);
  const release = f.read('releases/forever.json');
  for (const change of [
    { videoId: 'missing' },
    { artworkId: 'missing' },
    { releaseDate: '2026-02-30' },
    { trackUrl: '/songs/%2e%2e/secret.wav' },
  ]) {
    f.write('releases/forever.json', Object.assign({}, release, change));
    assert.throws(f.compile, /forever.json:/);
  }
  f.write(
    'releases/forever.json',
    Object.assign({}, release, { trackUrl: '/songs/not-installed.wav' }),
  );
  assert.ok(f.compile());
  fs.appendFileSync(
    path.join(f.directory, 'posts/forever.md'),
    '\n\n[Broken](/notes/missing?source=post#part)',
  );
  assert.throws(f.compile, /forever.md: Missing public asset/);
});

test('Shared destinations, ordering, visibility and default selection are editable as data', t => {
  const f = fixture(t);
  const links = f.read('links.json');
  links.instagram.url = 'https://example.com/new-instagram';
  f.write('links.json', links);
  const note = f.read('notes/guitar-parts.json');
  note.homepage = false;
  note.desktop = false;
  f.write('notes/guitar-parts.json', note);
  const settings = f.read('site.json');
  settings.defaultNoteId = 'guitarParts';
  settings.sidebar.socialIds.reverse();
  f.write('site.json', settings);
  const data = f.compile();
  assert.equal(data.profile.socialLinks.instagram, links.instagram.url);
  assert.equal(
    data.notes.find(item => item.id === 'thankYou').sections.sections[0]
      .items[0].url,
    links.instagram.url,
  );
  assert.ok(!data.home.items.some(item => item.target?.id === 'guitarParts'));
  assert.equal(
    data.notes.find(item => item.id === 'guitarParts').desktop,
    false,
  );
  assert.equal(data.settings.defaultNoteId, 'guitarParts');
});

test('A release without a published article has no canonical URL and cannot be featured', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.directory, 'posts/forever.md'));
  assert.equal(
    f.compile().releases.find(item => item.slug === 'forever').articlePath,
    undefined,
  );
  const home = f.read('home.json');
  home.featuredReleaseIds.push('forever');
  f.write('home.json', home);
  assert.throws(f.compile, /Featured release needs a published article/);
});

test('Collection watcher reports new files, edits and removals without watching generated output', async t => {
  const f = fixture(t);
  let count = 0;
  const watcher = watchContent(() => count++, f.directory, 20);
  t.after(() => watcher.close());
  async function change(action) {
    const previous = count;
    action();
    for (let i = 0; i < 100 && count === previous; i++)
      await new Promise(resolve => setTimeout(resolve, 20));
    assert.ok(count > previous, 'watcher should report the change');
  }
  await change(() => f.write('notes/watched.json', { status: 'draft' }));
  await change(() =>
    f.write('notes/watched.json', { status: 'draft', title: 'Changed' }),
  );
  await change(() =>
    fs.unlinkSync(path.join(f.directory, 'notes/watched.json')),
  );
  watcher.close();
});

test('Failed compilation keeps the last complete snapshot; unchanged inputs do not rewrite it', t => {
  const f = fixture(t);
  const destination = path.join(f.directory, 'generated/content.json');
  assert.equal(buildContent(f.directory, destination), true);
  const before = fs.readFileSync(destination, 'utf8');
  assert.equal(buildContent(f.directory, destination), false);
  fs.writeFileSync(path.join(f.directory, 'notes/thank-you.json'), '{invalid');
  assert.throws(
    () => buildContent(f.directory, destination),
    /thank-you.json:/,
  );
  assert.equal(fs.readFileSync(destination, 'utf8'), before);
  assert.ok(!fs.existsSync(destination + '.tmp'));
});
