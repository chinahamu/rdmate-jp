import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readText = (path: string) => readFileSync(path, 'utf8');

describe('docker compose deployment', () => {
  it('defines web and optional postgres services', () => {
    const compose = readText('docker-compose.yml');

    expect(compose).toContain('web:');
    expect(compose).toContain('postgres:');
    expect(compose).toContain('profiles:');
    expect(compose).toContain('postgres-data:');
  });

  it('persists application data and exposes a health check', () => {
    const compose = readText('docker-compose.yml');

    expect(compose).toContain('app-data:');
    expect(compose).toContain('/data');
    expect(compose).toContain('/api/health');
    expect(compose).toContain('healthcheck:');
  });

  it('builds a standalone Next.js image and initializes Prisma on startup', () => {
    const dockerfile = readText('Dockerfile');
    const nextConfig = readText('next.config.ts');

    expect(nextConfig).toContain('standalone');
    expect(dockerfile).toContain('pnpm db:generate');
    expect(dockerfile).toContain('npx prisma db push --skip-generate');
    expect(dockerfile).toContain('node server.js');
  });

  it('adds docker package scripts', () => {
    const packageJson = JSON.parse(readText('package.json')) as { scripts: Record<string, string> };

    expect(packageJson.scripts['docker:build']).toBe('docker compose build');
    expect(packageJson.scripts['docker:up']).toBe('docker compose up');
    expect(packageJson.scripts['docker:down']).toBe('docker compose down');
  });
});
