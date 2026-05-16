import { spawn } from 'node:child_process';

const REQUIRED = ['DATABASE_URL'];
const missing = REQUIRED.filter(k => !process.env[k] || process.env[k].trim() === '');

if (missing.length > 0) {
  console.error('================================================================');
  console.error('!!! Missing required environment variables: ' + missing.join(', '));
  console.error('');
  console.error('Visible env var names (npm_* filtered out):');
  const visible = Object.keys(process.env)
    .filter(k => !k.startsWith('npm_') && !k.startsWith('NODE_'))
    .sort();
  for (const k of visible) console.error('  - ' + k);
  console.error('');
  console.error('Fix: in the Railway dashboard for this service, go to Variables');
  console.error('and add/repair DATABASE_URL (typically a reference variable like');
  console.error('${{Postgres.DATABASE_URL}} pointing to your Postgres service).');
  console.error('================================================================');
  process.exit(1);
}

console.log('[start] env OK, running prisma db push...');

const push = spawn('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  shell: true,
});

push.on('exit', code => {
  if (code !== 0) {
    console.error('[start] prisma db push failed with exit code ' + code);
    process.exit(code);
  }
  console.log('[start] launching node dist/main');
  const app = spawn(process.execPath, ['dist/main'], { stdio: 'inherit' });
  app.on('exit', c => process.exit(c ?? 0));
});
