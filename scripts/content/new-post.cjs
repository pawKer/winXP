const fs = require('fs');
const path = require('path');
const { sourceDir } = require('./build.cjs');
const slug = process.argv[2];
if (
  !slug ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
  ['page', 'category'].includes(slug)
) {
  console.error(
    'Usage: yarn post:new my-post-title (lowercase words separated by hyphens)',
  );
  process.exit(1);
}
const filename = path.join(sourceDir, `${slug}.md`);
const template = fs.readFileSync(
  path.resolve(__dirname, '../../content/templates/post.md'),
  'utf8',
);
try {
  fs.writeFileSync(
    filename,
    template
      .replace('{{title}}', slug.replace(/-/g, ' '))
      .replace('{{date}}', new Date().toISOString().slice(0, 10)),
    { flag: 'wx' },
  );
  console.log(
    `Created content/posts/${slug}.md as a draft. Change status to published when ready.`,
  );
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.error(`Post already exists: ${filename}`);
  process.exitCode = 1;
}
