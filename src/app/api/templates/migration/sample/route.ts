import { migrateDmpTemplateAnswers } from '@/server/template-registry';

export function GET() {
  const report = migrateDmpTemplateAnswers('generic-jp-v1', 'generic-jp-v2', {
    'data_description.data_types': ['survey_data'],
    'storage_and_sharing.storage_location': '大学提供クラウド',
    'legacy.field': '旧テンプレートのみの回答',
  });

  return Response.json({
    apiVersion: 'v1',
    generatedAt: '2026-06-29T00:00:00.000Z',
    data: report,
  });
}
