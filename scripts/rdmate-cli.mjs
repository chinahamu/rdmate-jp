#!/usr/bin/env node

const [, , command, subcommandOrArg, ...restArgs] = process.argv;
const args = subcommandOrArg?.startsWith('--') || !subcommandOrArg ? [subcommandOrArg, ...restArgs].filter(Boolean) : restArgs;
const subcommand = subcommandOrArg?.startsWith('--') ? undefined : subcommandOrArg;

const sampleProject = {
  id: 'sample-project',
  title: '研究データ管理支援ツールの実証研究',
  templateId: 'generic-jp-v2',
};

const sampleDatasets = [
  {
    id: 'dataset-user-test-raw',
    project_id: sampleProject.id,
    name: 'DMP作成支援ユーザーテスト回答',
    data_type: 'survey_data',
    generated_date: '2026-06-01',
  },
  {
    id: 'dataset-analysis-code',
    project_id: sampleProject.id,
    name: '回答集計スクリプト',
    data_type: 'source_code',
    generated_date: '2026-06-12',
  },
];

const templates = [
  { id: 'generic-jp-v2', name: '汎用DMPテンプレート v2', version: '2.0.0' },
  { id: 'japanese-funder-jp-v1', name: '日本の助成機関向けDMPテンプレート', version: '1.0.0' },
  { id: 'nih-style-v1', name: 'NIH DMS Plan風テンプレート', version: '1.0.0' },
];

function readOption(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printUsage() {
  console.error([
    'Usage:',
    '  pnpm rdmate init',
    '  pnpm rdmate import datasets.csv',
    '  pnpm rdmate export --format json',
    '  pnpm rdmate validate --project <project-id>',
    '  pnpm rdmate template list',
  ].join('\n'));
}

if (command === 'init') {
  printJson({
    schemaVersion: '1.0.0',
    generatedBy: 'rdmate init',
    project: sampleProject,
    files: ['rdmate.project.json', 'datasets.csv', 'dmp.answers.json'],
    auth: { mode: 'none', note: 'Local use can run without authentication. Use passcode or project tokens for shared deployments.' },
  });
} else if (command === 'import' && subcommand === 'datasets.csv') {
  printJson({
    schemaVersion: '1.0.0',
    generatedBy: 'rdmate import datasets.csv',
    importedCount: sampleDatasets.length,
    datasets: sampleDatasets,
  });
} else if (command === 'export') {
  const format = readOption('--format', 'json');
  if (format !== 'json') {
    console.error('Only --format json is supported in the Phase 3 CLI preview.');
    process.exitCode = 1;
  } else {
    printJson({
      schemaVersion: '1.0.0',
      generatedBy: 'rdmate export --format json',
      project: sampleProject,
      datasets: sampleDatasets,
      templates,
    });
  }
} else if (command === 'validate') {
  const projectId = readOption('--project', sampleProject.id);
  printJson({
    schemaVersion: '1.0.0',
    generatedBy: 'rdmate validate --project',
    generatedAt: '2026-06-29T00:00:00.000Z',
    projectId,
    status: 'passed',
    validators: {
      storage: { status: 'passed', issueCount: 0 },
      metadata: { status: 'passed', score: 100 },
      reproducibility: { status: 'passed', score: 100 },
    },
  });
} else if (command === 'template' && subcommand === 'list') {
  printJson({
    schemaVersion: '1.0.0',
    generatedBy: 'rdmate template list',
    templates,
  });
} else {
  printUsage();
  process.exitCode = 1;
}
