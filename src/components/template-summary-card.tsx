import type { DmpTemplateSummary } from '@/domain/dmp-template';
import { getFundingAgencyTypeLabel } from '@/domain/funding';

type TemplateSummaryCardProps = Readonly<{
  template: DmpTemplateSummary;
  selected?: boolean;
}>;

export function TemplateSummaryCard({ template, selected = false }: TemplateSummaryCardProps) {
  return (
    <article className="template-card" aria-label={`${template.name} の詳細`}>
      <div className="template-card__header">
        <div>
          <p className="eyebrow">{template.id}</p>
          <h2>{template.name}</h2>
        </div>
        {selected ? <span className="template-card__badge">既定</span> : null}
      </div>
      {template.description ? <p>{template.description}</p> : null}
      <dl className="meta-list">
        <div>
          <dt>種別</dt>
          <dd>{template.templateTypeLabel}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{template.version}</dd>
        </div>
        <div>
          <dt>Locale</dt>
          <dd>{template.locale}</dd>
        </div>
        <div>
          <dt>項目数</dt>
          <dd>{template.questionCount}</dd>
        </div>
        <div>
          <dt>セクション数</dt>
          <dd>{template.sectionCount}</dd>
        </div>
        <div>
          <dt>対象分野</dt>
          <dd>{template.targetDiscipline}</dd>
        </div>
        <div>
          <dt>レビュー日</dt>
          <dd>{template.lastReviewedAt ?? template.lastUpdated}</dd>
        </div>
      </dl>
      <p className="template-card__targets">
        対象助成機関:{' '}
        {template.targetFundingAgencyTypes.map((agencyType) => getFundingAgencyTypeLabel(agencyType)).join(' / ')}
      </p>
      <p className="template-card__targets">メンテナー: {template.maintainer}</p>
      {template.deprecated ? (
        <p className="template-card__targets">
          非推奨: {template.deprecated.reason}
          {template.deprecated.replacedBy ? ` / 後継: ${template.deprecated.replacedBy}` : ''}
        </p>
      ) : null}
    </article>
  );
}
