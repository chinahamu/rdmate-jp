import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DmpHelperPanel } from '@/components/dmp-helper-panel';
import { DmpSectionForm } from '@/components/dmp-section-form';
import { UnsavedChangeWarning } from '@/components/unsaved-change-warning';
import {
  applyProjectAutofill,
  generateDmpFormSections,
  validateDmpAnswers,
} from '@/domain/dmp-answer';
import { getSampleResearchProject } from '@/server/sample-project';
import { getDmpTemplateById } from '@/server/template-registry';

export const metadata: Metadata = {
  title: 'DMP入力フォーム | RDMate JP',
};

export default function DmpEditorPage() {
  const project = getSampleResearchProject();
  const template = getDmpTemplateById('generic-jp-v1');

  if (!template) {
    throw new Error('DMP template not found.');
  }

  const answers = applyProjectAutofill(template, project);
  const sections = generateDmpFormSections(template, answers);
  const issues = validateDmpAnswers(template, answers, project);

  return (
    <AppShell>
      <UnsavedChangeWarning />
      <section className="hero">
        <p className="eyebrow">DMP Editor</p>
        <h1>DMP入力フォーム</h1>
        <p>
          テンプレート定義からセクション別フォームを生成し、研究課題情報から入力候補を自動補完します。
        </p>
      </section>

      <section className="card dmp-editor-summary" aria-label="DMP編集対象">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
        </div>
        <dl className="meta-list">
          <div>
            <dt>テンプレート</dt>
            <dd>{template.name}</dd>
          </div>
          <div>
            <dt>終了予定日</dt>
            <dd>{project.expectedEndDate}</dd>
          </div>
        </dl>
      </section>

      <div className="dmp-editor-layout">
        <nav className="dmp-section-nav" aria-label="DMPセクション">
          <h2>セクション</h2>
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}-heading`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="dmp-section-stack">
          {sections.map((section) => (
            <DmpSectionForm key={section.id} section={section} issues={issues} />
          ))}
        </div>

        <DmpHelperPanel />
      </div>
    </AppShell>
  );
}
