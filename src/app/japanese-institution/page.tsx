import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { JapaneseInstitutionDashboard } from '@/components/japanese-institution-dashboard';
import { getSampleResearchProject } from '@/server/sample-project';

export const metadata: Metadata = {
  title: '日本の研究機関向け配慮 | RDMate JP',
};

export default function JapaneseInstitutionPage() {
  const project = getSampleResearchProject();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Japan Support</p>
        <h1>日本の研究機関向け配慮</h1>
        <p>
          日本語氏名・英語氏名の併記、所属部局・研究科・専攻の階層管理、科研費課題番号等の入力補助、
          日本語DMP出力の標準化を確認します。
        </p>
      </section>

      <JapaneseInstitutionDashboard project={project} />
    </AppShell>
  );
}
