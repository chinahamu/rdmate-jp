import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { TemplateSummaryCard } from '@/components/template-summary-card';
import { getDefaultDmpTemplateId, listDmpTemplates } from '@/server/template-registry';

export const metadata: Metadata = {
  title: 'DMPテンプレート | RDMate JP',
};

export default function TemplatesPage() {
  const templates = listDmpTemplates();
  const defaultTemplateId = getDefaultDmpTemplateId();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">DMP Templates</p>
        <h1>DMPテンプレート</h1>
        <p>
          利用可能なDMPテンプレートの一覧です。種別、対象助成機関、対象分野、メンテナー、レビュー日を確認できます。
        </p>
      </section>

      <section className="template-grid" aria-label="利用可能テンプレート一覧">
        {templates.map((template) => (
          <TemplateSummaryCard
            key={template.id}
            template={template}
            selected={template.id === defaultTemplateId}
          />
        ))}
      </section>
    </AppShell>
  );
}
