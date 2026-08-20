import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const clientDir = join(rootDir, 'client');
const serverDir = join(rootDir, 'server', 'next-app');
const isWindows = process.platform === 'win32';

const resolveCommand = (command) => {
  if (isWindows && command === 'npm') {
    return 'npm';
  }

  return command;
};

const quoteArg = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
const commandLine = (command, args) => [resolveCommand(command), ...args.map(quoteArg)].join(' ');

const run = (command, args, options = {}) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(commandLine(command, args), {
      cwd: options.cwd || rootDir,
      env: {
        ...process.env,
        ...options.env,
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

await run('npm', ['run', 'build'], { cwd: clientDir });
await run('node', [join(rootDir, 'scripts', 'publish-client.mjs')], { cwd: rootDir });
await run('npm', ['run', 'build'], {
  cwd: serverDir,
  env: {
    NODE_ENV: 'production',
  },
});
