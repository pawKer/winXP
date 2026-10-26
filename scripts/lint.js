const { spawnSync } = require('child_process');
const path = require('path');

// CRA installs its compatible ESLint beside react-scripts even when the
// repository's older top-level ESLint resolves first.
const eslintPackage = require.resolve('eslint/package.json', {
  paths: [require.resolve('react-scripts/package.json')],
});
const eslint = path.join(path.dirname(eslintPackage), 'bin', 'eslint.js');
const result = spawnSync(process.execPath, [eslint, 'src'], {
  stdio: 'inherit',
});
process.exit(result.status === null ? 1 : result.status);
