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
