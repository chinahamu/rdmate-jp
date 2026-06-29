#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const backup = process.argv.includes('--backup') ? process.argv[process.argv.indexOf('--backup') + 1] : undefined;
const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : 'prisma/dev.db';

if (!backup) {
  throw new Error('Usage: node scripts/sqlite-restore.mjs --backup <backup-file> --target <sqlite-file>');
}

const backupPath = path.resolve(backup);
const targetPath = path.resolve(target);
const targetDir = path.dirname(targetPath);

await fs.mkdir(targetDir, { recursive: true });
await fs.copyFile(backupPath, targetPath);
console.log(`SQLite restored from ${backupPath} to ${targetPath}`);
