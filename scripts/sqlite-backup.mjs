#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const source = process.argv.includes('--source') ? process.argv[process.argv.indexOf('--source') + 1] : 'prisma/dev.db';
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'backups';
const sourcePath = path.resolve(source);
const outDir = path.resolve(out);
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const backupPath = path.join(outDir, `rdmate-sqlite-${stamp}.backup`);

await fs.mkdir(outDir, { recursive: true });
await fs.copyFile(sourcePath, backupPath);
console.log(`SQLite backup created: ${backupPath}`);
