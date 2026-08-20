import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const clientDistDir = join(rootDir, 'client', 'dist');
const serverPublicDir = join(rootDir, 'server', 'next-app', 'public');

if (!existsSync(clientDistDir)) {
  throw new Error('client/dist does not exist. Run npm --prefix client run build first.');
}

mkdirSync(serverPublicDir, { recursive: true });

for (const entry of ['assets', 'index.html']) {
  const target = join(serverPublicDir, entry);

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

cpSync(clientDistDir, serverPublicDir, { recursive: true });

console.log(`[publish] Copied client/dist to ${serverPublicDir}`);
