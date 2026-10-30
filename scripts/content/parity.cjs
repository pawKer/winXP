// One-time migration audit. Later intentional content edits can change this baseline.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parse, serialize } = require('parse5');
const { buildContent } = require('./build.cjs');
buildContent();
const baseline = require('../../content-sources/content-data-baseline.json');
const { pages, renderContent } = require('../../src/content/pages');
const {
  profile,
  notes,
  releases,
  playlistTracks,
} = require('../../src/content/site');

assert.deepEqual(profile.socialLinks, baseline.profile.socialLinks);
for (const before of baseline.releases) {
  const after = releases.find(release => release.slug === before.slug);
  for (const key of Object.keys(before))
    assert.deepEqual(after[key], before[key], `${before.slug}.${key}`);
}
for (const before of baseline.notes) {
  const after = notes.find(note => note.id === before.id);
  for (const key of ['title', 'path', 'description'])
    assert.equal(after[key], before[key]);
  before.sections.sections.forEach((section, index) => {
    const next = after.sections.sections[index];
    assert.equal(next.title, section.title);
    section.items.forEach((item, itemIndex) => {
      for (const key of Object.keys(item))
        assert.deepEqual(
          next.items[itemIndex][key],
          item[key],
          `${before.id}.${index}.${itemIndex}.${key}`,
        );
    });
  });
}
assert.deepEqual(playlistTracks, baseline.playlist);
assert.deepEqual(
  pages.map(page => ({
    path: page.path,
    kind: page.kind,
    redirectTo: page.redirectTo || null,
  })),
  baseline.routes,
);
for (const page of pages.filter(item => !item.redirectTo)) {
  const normalized = serialize(parse(renderContent(page, { reading: true })));
  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
  assert.equal(
    hash,
    baseline.domHashes[page.path],
    `${page.path}: rendered DOM changed`,
  );
}
console.log(
  `Migration parity passed: ${notes.length} notes, ${releases.length} releases, ${playlistTracks.length} tracks, ${pages.length} routes and all rendered DOM snapshots.`,
);
