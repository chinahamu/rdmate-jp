import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const readText = (path: string) => readFileSync(path, 'utf8');

describe('local development setup', () => {
  it('defines bootstrap scripts for local use', () => {
    const packageJson = JSON.parse(readText('package.json')) as { scripts: Record<string, string> };

    expect(packageJson.scripts.dev).toContain('ensure-local-dev');
    expect(packageJson.scripts['setup:local']).toContain('ensure-local-dev');
    expect(packageJson.scripts['db:push']).toContain('prisma db push');
    expect(packageJson.scripts['db:seed']).toContain('seed-sample-data');
  });

  it('documents local environment defaults', () => {
    const envExample = readText('.env.example');

    expect(envExample).toContain('DATABASE_URL');
    expect(envExample).toContain('RDMATE_AUTO_SEED');
    expect(envExample).toContain('RDMATE_LOCAL_SETUP_ON_DEV');
  });

  it('includes local bootstrap and sample data files', () => {
    const setupScript = readText('scripts/ensure-local-dev.mjs');
    const seedScript = readText('scripts/seed-sample-data.mjs');

    expect(setupScript).toContain('prisma');
    expect(setupScript).toContain('seed-sample-data');
    expect(seedScript).toContain('RDMate JP サンプル研究課題');
    expect(seedScript).toContain('Dataset');
  });
});
