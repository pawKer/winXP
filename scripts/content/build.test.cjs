const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parsePost, compilePosts, buildContent } = require('./build.cjs');

const video = {
  id: 'example',
  publishedAt: '2024-06-10T12:30:00Z',
  sourceUrl: 'https://www.youtube.com/watch?v=example',
};
const refs = {
  videoById: id => (id === video.id ? video : null),
  releases: [{ slug: 'song' }],
  notes: [{ id: 'resources' }],
};
const source = (extra = '', body = '## A heading\n\nA paragraph.') =>
  `---\ntitle: Example post\nexcerpt: A useful description.\ncategory: Projects\nstatus: published\npublishedAt: "2025-01-01"\n${extra}\n---\n\n${body}`;
const parse = (extra, body) =>
  parsePost(source(extra, body), 'example-post.md', refs);

test('Markdown supports ordinary authoring without executable HTML', () => {
  const post = parse(
    '',
    '## Heading\n\n**Bold** and *emphasis*.\n\n- A list\n- Another item\n\n> A quote\n\n```js\nconst value = 1;\n```\n\n| Part | Count |\n| --- | --- |\n| Switch | 2 |\n\n<script>alert(1)</script>\n\n[Unsafe](javascript:alert(1))\n\n[External](https://example.com)\n\n[Notes](/notes/guitar-parts#resources)',
  );
  for (const html of [
    '<h2>Heading</h2>',
    '<strong>Bold</strong>',
    '<em>emphasis</em>',
    '<ul>',
    '<blockquote>',
    '<pre><code',
    '<table>',
    '&lt;script&gt;',
    'target="_blank" rel="noopener noreferrer"',
    'href="/notes/guitar-parts#resources"',
  ])
    assert.ok(post.bodyHtml.includes(html), html);
  assert.ok(!post.bodyHtml.includes('<script>'));
  assert.ok(!post.bodyHtml.includes('href="javascript:'));
  assert.throws(
    () => parse('', '[Other post](other-post.md)'),
    /root-relative/,
  );
  assert.throws(() => parse('', '# Duplicate page title'), /template supplies/);
});

test('Video dates and references remain authoritative while article dates are supported', () => {
  const post = parse(
    'videoId: example\nreleaseId: song\nnoteIds: [resources]\nextraVideoIds: [example]\nchapters: [[0, Intro]]',
  );
  assert.equal(post.publishedAt, video.publishedAt);
  assert.equal(post.dateSource, 'video');
  assert.equal(post.sourceUrl, video.sourceUrl);
  assert.equal(
    parse('videoId: example\ndateSource: article').publishedAt,
    '2025-01-01',
  );
  for (const extra of [
    'videoId: missing',
    'releaseId: missing',
    'noteIds: [missing]',
    'extraVideoIds: [missing]',
    'dateSource: video',
    'chapters: [[0, Intro]]',
    'updatedAt: "2023-01-01"',
    'sourceUrl: javascript:alert(1)',
    'category: []',
    'unknown: yes',
  ])
    assert.throws(() => parse(extra), undefined, extra);
});

test('Malformed metadata fails clearly, and drafts need no completed fields', () => {
  assert.throws(
    () => parsePost('No header', 'example.md', refs),
    /YAML header/,
  );
  assert.throws(
    () =>
      parsePost(
        source().replace('2025-01-01', '2025-02-30'),
        'example.md',
        refs,
      ),
    /ISO date/,
  );
  assert.throws(() => parsePost(source() + '', 'page.md', refs), /reserved/);
  assert.throws(
    () => parsePost(source('title: Duplicate'), 'example.md', refs),
    /unique/i,
  );
  assert.equal(
    parsePost('---\nstatus: draft\n---\nPRIVATE DRAFT', 'draft.md', refs),
    null,
  );
  assert.equal(
    parsePost('---\ntitle: Unfinished\n---\nPrivate', 'draft.md', refs),
    null,
  );
});

test('Directory discovery excludes drafts and catches duplicate IDs/category URLs', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'winxp-content-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'first.md'), source());
  fs.writeFileSync(
    path.join(dir, 'draft.md'),
    '---\nstatus: draft\n---\nPRIVATE DRAFT',
  );
  assert.equal(compilePosts(dir, refs).length, 1);
  assert.ok(!JSON.stringify(compilePosts(dir, refs)).includes('PRIVATE DRAFT'));
  fs.writeFileSync(path.join(dir, 'second.md'), source('id: first'));
  assert.throws(() => compilePosts(dir, refs), /second.md: Duplicate post id/);
  fs.writeFileSync(
    path.join(dir, 'second.md'),
    source().replace('category: Projects', 'category: projects'),
  );
  assert.throws(() => compilePosts(dir, refs), /Category URL collision/);
});

test('A new category and article automatically reach routes, sidebar, schema and discovery templates', () => {
  const post = parsePost(
    source().replace('category: Projects', 'category: Studio Diary'),
    'a-new-post.md',
    refs,
  );
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      String.raw`
    const assert = require('node:assert/strict');
    const posts = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    const filename = require.resolve('./src/content/posts');
    require.cache[filename] = { exports: { posts } };
    const { getPage, renderContent, structuredData } = require('./src/content/pages');
    const { renderSitemap, renderFeed } = require('./scripts/templates/discovery.cjs');
    assert.ok(getPage('/blog/a-new-post'));
    assert.ok(getPage('/blog/category/studio-diary'));
    assert.match(renderContent(getPage('/blog')), /\/blog\/category\/studio-diary/);
    assert.match(renderContent(getPage('/blog/a-new-post')), /Example post/);
    assert.ok(structuredData(getPage('/blog/a-new-post'))['@graph'].some(item => item['@type'] === 'BlogPosting'));
    assert.match(renderSitemap(), /\/blog\/a-new-post/);
    assert.match(renderFeed(), /<category>Studio Diary<\/category>/);
  `,
    ],
    {
      cwd: path.resolve(__dirname, '../..'),
      input: JSON.stringify([post]),
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr);
});

test('Compilation is stable and reading links preserve mode, query and fragment', () => {
  buildContent();
  assert.equal(buildContent(), false);
  const {
    renderMarkdown,
  } = require('../../src/content/templates/blog/markdown');
  const post = parse(
    '',
    '[Parts](/notes/guitar-parts?source=post#parts)\n\n[Blog](/blog)\n\n[Download](/file.zip)\n\n[Desktop](/?view=desktop)',
  );
  const reading = renderMarkdown(post, { reading: true });
  assert.match(
    reading,
    /href="\/notes\/guitar-parts\?source=post&amp;view=read#parts"/,
  );
  assert.ok(reading.includes('href="/blog"'));
  assert.ok(reading.includes('href="/file.zip"'));
  assert.ok(reading.includes('href="/?view=desktop"'));
  assert.equal(renderMarkdown(post, {}), post.bodyHtml);
});

test('Music is a view of canonical articles and every old song URL resolves to its article', () => {
  buildContent();
  const {
    pages,
    getPage,
    publishedPosts,
  } = require('../../src/content/registry');
  const { renderContent, structuredData } = require('../../src/content/pages');
  const { releases } = require('../../src/content/site');
  const { renderSitemap } = require('../templates/discovery.cjs');
  const { internal } = require('../../src/content/templates/helpers');
  const music = renderContent(getPage('/music'), { reading: true });
  assert.equal(
    (music.match(/class="record-cover"/g) || []).length,
    releases.length - 1,
  );
  for (const release of releases) {
    const post = publishedPosts.find(item => item.releaseId === release.slug);
    assert.ok(post, release.slug);
    assert.equal(getPage(release.path), getPage(post.path));
    assert.equal(
      pages.find(page => page.path === release.path).redirectTo,
      post.path,
    );
    assert.ok(music.includes(`href="${post.path}"`));
    assert.ok(!music.includes(`href="${release.path}"`));
    assert.ok(
      !renderSitemap().includes(`<loc>https://reshra.xyz${release.path}</loc>`),
    );
    assert.ok(
      internal(release.path + '?source=shared#listen', 'Song').includes(
        post.path + '?source=shared#listen',
      ),
    );
    const html = renderContent(getPage(post.path), { reading: true });
    assert.ok(html.includes(release.listeningUrl.replace(/&/g, '&amp;')));
    assert.ok(html.includes(`data-native-audio="${release.slug}"`));
    assert.ok(html.includes(`data-play-desktop="${release.slug}"`));
    assert.ok(html.includes(`?view=desktop&amp;play=${release.slug}#listen`));
    assert.ok(!html.includes('data-copy-link'));
    assert.ok(!html.includes('Original source'));
    assert.ok(!html.includes('data-play-winamp'));
    if (release.guitarHeroUrl)
      assert.ok(html.includes(release.guitarHeroUrl.replace(/&/g, '&amp;')));
    const embedded = renderContent(getPage(post.path), { embedded: true });
    assert.ok(embedded.includes(`data-play-winamp="${release.slug}"`));
    assert.ok(!embedded.includes('data-native-audio='));
    const graph = structuredData(getPage(post.path))['@graph'];
    assert.equal(new Set(graph.map(item => item['@id'])).size, graph.length);
    assert.equal(
      graph.find(item => item['@type'] === 'MusicRecording').url,
      `https://reshra.xyz${post.path}`,
    );
    if (release.video) assert.equal((html.match(/<iframe /g) || []).length, 1);
  }
});

test('My Documents renders shared navigation, readable note panes and inactive media safely', () => {
  const { getPage, renderContent } = require('../../src/content/pages');
  for (const path of [
    '/blog',
    '/music',
    '/notes',
    '/notes/guitar-parts',
    '/blog/building-my-midi-pedal',
  ]) {
    const html = renderContent(getPage(path), { reading: true });
    assert.ok(html.includes('class="xp-site blog-page"'), path);
    assert.ok(html.includes('src="/icons/windows.png"'), path);
    assert.equal((html.match(/class="social-icon"/g) || []).length, 3, path);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path);
    assert.equal((html.match(/<main(?:\s|>)/g) || []).length, 1, path);
  }
  const note = renderContent(getPage('/notes/guitar-parts'), { reading: true });
  assert.ok(note.includes('aria-label="Choose a note"'));
  assert.equal((note.match(/width="20" height="20"/g) || []).length, 4);
  assert.ok(!note.includes('sidebar-categories'));
  assert.ok(note.includes('affiliate links. I may earn'));
  const hidden = renderContent(getPage('/blog/forever'), {
    embedded: true,
    mediaActive: false,
  });
  assert.ok(!hidden.includes('<iframe'));
  assert.ok(hidden.includes('https://www.youtube.com/watch?'));
  const article = renderContent(getPage('/blog/forever'), { reading: true });
  assert.ok(article.includes('aria-label="Breadcrumb"'));
  assert.ok(article.includes('href="/blog/category/music"'));
  assert.ok(article.includes('Listen in browser instead'));
  assert.ok(article.includes('class="small-button" data-listen='));
});

test('Article search covers older pages, respects categories and restores pagination entries', () => {
  const { getPage } = require('../../src/content/registry');
  const {
    renderBlogEntries,
  } = require('../../src/content/templates/blog/feed');
  const page = getPage('/blog');
  const older = renderBlogEntries(page, {}, 'forever');
  assert.equal(older.count, 1);
  assert.ok(older.html.includes('href="/blog/forever"'));
  assert.equal(
    renderBlogEntries(getPage('/blog/category/projects'), {}, 'forever').count,
    0,
  );
  assert.ok(
    renderBlogEntries(page, {}, 'no-such-article-zzzz').html.includes(
      'No entries found',
    ),
  );
  assert.equal(renderBlogEntries(page, {}, '').count, 6);
});

test('Every published article omits the source/copy footer controls', () => {
  const {
    getPage,
    publishedPosts,
    renderContent,
  } = require('../../src/content/pages');
  for (const post of publishedPosts) {
    const html = renderContent(getPage(post.path), { reading: true });
    assert.ok(!html.includes('Original source'), post.slug);
    assert.ok(!html.includes('data-copy-link'), post.slug);
    assert.ok(!html.includes('class="article-footer"'), post.slug);
  }
});
