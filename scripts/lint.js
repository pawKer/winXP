const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// CRA installs its compatible ESLint beside react-scripts even when the
// repository's older top-level ESLint resolves first.
const eslintPackage = require.resolve('eslint/package.json', {
  paths: [require.resolve('react-scripts/package.json')],
});
const eslint = path.join(path.dirname(eslintPackage), 'bin', 'eslint.js');
const result = spawnSync(process.execPath, [eslint, 'src', 'scripts'], {
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status || 1);
for (const file of fs.readdirSync(path.join(__dirname))) {
  if (!file.endsWith('.cjs')) continue;
  const syntax = spawnSync(
    process.execPath,
    ['--check', path.join(__dirname, file)],
    {
      stdio: 'inherit',
    },
  );
  if (syntax.status !== 0) process.exit(syntax.status || 1);
}
