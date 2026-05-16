import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svc = (process.env.RAILWAY_SERVICE_NAME || '').toLowerCase();

let dir;
if (svc.includes('admin')) {
  dir = 'frontend/portal-admin';
} else if (svc.includes('paciente')) {
  dir = 'frontend/portal-paciente';
} else if (
  svc.includes('referencia') ||
  svc.includes('sparkling') ||
  svc.includes('renewal')
) {
  dir = 'frontend/portal-referencia';
} else {
  dir = 'backend';
}

console.log(`[dispatch] RAILWAY_SERVICE_NAME='${svc}' -> ${dir}/start.mjs`);

const child = spawn(process.execPath, ['start.mjs'], {
  cwd: path.join(__dirname, dir),
  stdio: 'inherit',
});

child.on('exit', code => process.exit(code ?? 0));
