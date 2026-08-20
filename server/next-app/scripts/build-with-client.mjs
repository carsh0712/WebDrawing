import { spawn } from 'node:child_process';
import { existsSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const serverDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootDir = resolve(serverDir, '..', '..');
const clientDir = join(rootDir, 'client');
const clientDistDir = join(clientDir, 'dist');
const clientNodeModulesDir = join(clientDir, 'node_modules');
const nextBuildDir = join(serverDir, '.next');
const serverPublicDir = join(serverDir, 'public');
const isVercelBuild = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

const quoteArg = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
const commandLine = (command, args) => [command, ...args.map(quoteArg)].join(' ');

const run = (command, args, cwd, env = {}) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(commandLine(command, args), {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

if (!existsSync(clientDir)) {
  throw new Error(`Client directory not found at ${clientDir}. Check the Vercel Root Directory and repository layout.`);
}

if (isVercelBuild || !existsSync(clientNodeModulesDir)) {
  console.log('[build] Installing client dependencies...');
  await run('npm', ['ci', '--include=dev'], clientDir, {
    NODE_ENV: 'development',
    npm_config_production: 'false',
  });
} else {
  console.log('[build] Using existing client dependencies.');
}

console.log('\n[build] Building Vite client...');
await run('npm', ['run', 'build'], clientDir);

if (!existsSync(clientDistDir)) {
  throw new Error('client/dist does not exist after client build.');
}

console.log('\n[build] Publishing client assets into Next.js public directory...');
mkdirSync(serverPublicDir, { recursive: true });

for (const entry of ['assets', 'index.html']) {
  const target = join(serverPublicDir, entry);

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

cpSync(clientDistDir, serverPublicDir, { recursive: true });

console.log('\n[build] Building Next.js server...');
if (existsSync(nextBuildDir)) {
  rmSync(nextBuildDir, { recursive: true, force: true });
}
await run('npm', ['run', 'build:next'], serverDir, { NODE_ENV: 'production' });
