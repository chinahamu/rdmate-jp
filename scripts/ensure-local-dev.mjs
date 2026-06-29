#!/usr/bin/env node

import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const envPath = '.env';
const envExamplePath = '.env.example';

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath);
  console.log('Created .env from .env.example');
}

loadLocalEnv(envPath);

if (process.env.RDMATE_LOCAL_SETUP_ON_DEV === 'false') {
  console.log('Local setup skipped by RDMATE_LOCAL_SETUP_ON_DEV=false');
  process.exit(0);
}

run('pnpm', ['prisma', 'generate']);
run('pnpm', ['prisma', 'db', 'push', '--skip-generate']);

if (process.env.RDMATE_AUTO_SEED !== 'false') {
  run('node', ['scripts/seed-sample-data.mjs', '--if-empty']);
}

function loadLocalEnv(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^['\"]|['\"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function run(command, args) {
  const fullCommand = `${command} ${args.join(' ')}`;
  console.log(`$ ${fullCommand}`);
  execSync(fullCommand, { stdio: 'inherit' });
}
