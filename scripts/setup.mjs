import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

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

const run = (command, args, cwd = rootDir) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(commandLine(command, args), {
      cwd,
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

const runOutput = (command, args, cwd = rootDir) =>
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

const runShellOutput = (commandLine, cwd = rootDir) =>
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

const waitForDatabase = async () => {
  console.log('[setup] Waiting for development database health check...');
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const result = await runOutput(
        'docker-compose',
        ['exec', '-T', 'db', 'pg_isready', '-U', 'webdrawing', '-d', 'webdrawing_dev'],
        serverDir,
      );

      if (result.includes('accepting connections')) {
        console.log('[setup] Development database is accepting connections.');
        return;
      }
    } catch {
      await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1500));
    }
  }

  throw new Error('Development database did not become ready within 60 seconds.');
};

const verifyTables = async () => {
  console.log('[setup] Verifying development DB tables...');
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
      console.log('[setup] Required development DB tables are ready.');
      return;
    }

    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1500));
  }

  throw new Error('Required development DB tables were not created within 60 seconds.');
};

console.log('[setup] Installing server dependencies...');
await run('npm', ['install'], serverDir);

console.log('\n[setup] Resetting development database volume...');
await run('docker-compose', ['down', '-v'], serverDir);
await run('docker-compose', ['up', '-d', 'db'], serverDir);
await waitForDatabase();
await runShellOutput('docker-compose exec -T db psql -U webdrawing -d webdrawing_dev -f /docker-entrypoint-initdb.d/001_schema.sql', serverDir);
await verifyTables();

console.log('\n[setup] Installing client dependencies...');
await run('npm', ['install'], clientDir);

console.log('\n[setup] Building client and publishing it through the server...');
await run('npm', ['run', 'build'], clientDir);
await run('node', [join(rootDir, 'scripts', 'publish-client.mjs')], rootDir);

console.log('\n[setup] Complete. Development DB, server dependencies, client dependencies, and published client assets are ready.');
