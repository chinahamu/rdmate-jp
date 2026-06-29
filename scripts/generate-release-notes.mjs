#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const tag = args.get('--tag') ?? `v${readPackageVersion()}`;
const image = args.get('--image') ?? `ghcr.io/chinahamu/rdmate-jp:${tag.replace(/^v/, '')}`;
const output = args.get('--output') ?? 'RELEASE_NOTES.md';
const version = tag.replace(/^v/, '');

const changelogSection = readChangelogSection(version);
const notes = renderReleaseNotes({ tag, version, image, changelogSection });

writeFileSync(path.join(repoRoot, output), notes);
console.log(`Wrote ${output} for ${tag}`);

function readPackageVersion() {
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  return packageJson.version;
}

function readChangelogSection(targetVersion) {
  const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    return 'CHANGELOG.md がまだ生成されていません。Release PRで生成された変更履歴を確認してください。';
  }

  const changelog = readFileSync(changelogPath, 'utf8');
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(targetVersion)}(?:\\s|$).*`, 'm');
  const match = changelog.match(headingPattern);

  if (!match || match.index === undefined) {
    return `CHANGELOG.md に ${targetVersion} のセクションが見つかりませんでした。`;
  }

  const sectionStart = match.index;
  const nextHeadingMatch = changelog.slice(sectionStart + match[0].length).match(/^##\s+/m);
  const sectionEnd = nextHeadingMatch?.index === undefined
    ? changelog.length
    : sectionStart + match[0].length + nextHeadingMatch.index;

  return changelog.slice(sectionStart, sectionEnd).trim();
}

function renderReleaseNotes({ tag, version, image, changelogSection }) {
  return [
    `# RDMate JP ${tag}`,
    '',
    '## 変更内容',
    '',
    changelogSection,
    '',
    '## Docker image',
    '',
    'GitHub Container RegistryにDocker imageを公開します。',
    '',
    '```bash',
    `docker pull ${image}`,
    '```',
    '',
    'Docker Composeで利用する場合は、必要に応じて `docker-compose.yml` の `web.image` を次のように指定します。',
    '',
    '```yaml',
    'services:',
    '  web:',
    `    image: ${image}`,
    '```',
    '',
    '## 移行手順',
    '',
    '1. 現在のデータベースと `.env` / `.env.docker.example.local` 相当の設定をバックアップします。',
    '2. Release NotesとCHANGELOGの破壊的変更、Prisma schema変更、環境変数変更を確認します。',
    '3. Docker運用では、対象タグのimageをpullします。',
    '4. SQLite運用では、既存のDBファイルを退避してからアプリケーションを更新します。',
    '5. PostgreSQL運用では、事前に `pg_dump` などでバックアップを取得します。',
    '6. 起動後、`/api/health`、DMP出力、Dataset台帳、監査履歴を確認します。',
    '7. 問題がある場合は、バックアップから復元し、対象ReleaseのIssueに環境と再現手順を記録します。',
    '',
    '## 検証',
    '',
    '- `pnpm lint`',
    '- `pnpm typecheck`',
    '- `pnpm test`',
    '- `pnpm build`',
    '- Docker image build and push',
    '',
    '## 成果物',
    '',
    `- Source archive: \`rdmate-jp-${tag}.tar.gz\``,
    '- Checksums: `SHA256SUMS`',
    `- Docker image: \`${image}\``,
    '',
    `Version: ${version}`,
    '',
  ].join('\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
