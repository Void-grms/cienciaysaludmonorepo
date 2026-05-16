import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || '3000';
const servePath = require.resolve('serve/build/main.js');

console.log(`[start] launching serve on tcp://0.0.0.0:${port}`);

const child = spawn(
  process.execPath,
  [servePath, '-s', 'dist', '-l', `tcp://0.0.0.0:${port}`],
  { stdio: 'inherit', cwd: __dirname }
);

child.on('exit', code => process.exit(code ?? 0));
