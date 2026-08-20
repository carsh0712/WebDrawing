import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
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
      shell: true,
      stdio: options.stdio || 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

const runOutput = (command, args, cwd) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(commandLine(command, args), {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || `${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

const runShellOutput = (commandLine, cwd) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(commandLine, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || `${commandLine} failed with exit code ${code}`));
    });
  });

const installDependencies = async (name, cwd) => {
  console.log(`\n[setup] Installing ${name} dependencies...`);
  await run('npm', ['install'], { cwd });
};

const ensureDatabase = async () => {
  console.log('\n[db] Starting development database...');
  await run('docker-compose', ['up', '-d', 'db'], { cwd: serverDir });

  console.log('[db] Waiting for database health check...');
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const result = await runOutput(
        'docker-compose',
        ['exec', '-T', 'db', 'pg_isready', '-U', 'webdrawing', '-d', 'webdrawing_dev'],
        serverDir,
      );

      if (result.includes('accepting connections')) {
        console.log('[db] Database is accepting connections.');
        return;
      }
    } catch {
      await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1500));
    }
  }

  throw new Error('Development database did not become ready within 60 seconds.');
};

const verifyTables = async () => {
  console.log('[db] Verifying required tables...');
  const requiredTables = [
    'auth.users',
    'public.profiles',
    'public.drawing_projects',
    'public.uploaded_images',
    'public.share_links',
  ];
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const checks = await Promise.all(
      requiredTables.map((tableName) =>
        runShellOutput(
          `docker-compose exec -T db psql -U webdrawing -d webdrawing_dev -tAc "select to_regclass('${tableName}') is not null;"`,
          serverDir,
        ),
      ),
    );

    if (checks.every((value) => value === 't')) {
      console.log('[db] Required tables are ready.');
      return;
    }

    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1500));
  }

  throw new Error('Required DB tables are missing. Run npm run setup to reset the dev DB.');
};

const buildClientForServer = async () => {
  console.log('\n[publish] Building client bundle for server publishing...');
  await run('npm', ['run', 'build'], { cwd: clientDir });
  await run('node', [join(rootDir, 'scripts', 'publish-client.mjs')], { cwd: rootDir });
};

const startProcess = (name, command, args, cwd) => {
  const child = spawn(commandLine(command, args), {
    cwd,
    shell: true,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if (code && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
      process.exitCode = code;
      shutdown();
    }
  });

  return child;
};

let shuttingDown = false;
let serverProcess;
let clientProcess;

const shutdown = () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  serverProcess?.kill();
  clientProcess?.kill();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (!existsSync(clientDir) || !existsSync(serverDir)) {
  throw new Error('Expected client/ and server/next-app/ directories to exist.');
}

await installDependencies('server', serverDir);
await ensureDatabase();
await verifyTables();
await installDependencies('client', clientDir);
await buildClientForServer();

console.log('\n[dev] Starting Next.js server and Vite client...');
serverProcess = startProcess('server', 'npm', ['run', 'dev'], serverDir);
clientProcess = startProcess('client', 'npm', ['run', 'dev'], clientDir);
