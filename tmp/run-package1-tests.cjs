const { execFileSync } = require('node:child_process');
execFileSync('./node_modules/.bin/tsc', ['-p', 'tmp/tsconfig.package1-tests.json'], { stdio: 'inherit' });
execFileSync('node', ['/tmp/bwe-package1-tests/marketplace/__tests__/package1-tests.js'], { stdio: 'inherit' });
