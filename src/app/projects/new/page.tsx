import Link from 'next/link';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { getDefaultDmpTemplateId, listDmpTemplates } from '@/server/template-registry';

export const metadata: Metadata = {
  title: '研究課題作成 | RDMate JP',
};

export default function ProjectNewPage() {
  const templates = listDmpTemplates();
  const defaultTemplateId = getDefaultDmpTemplateId();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">New Project</p>
        <h1>研究課題を作成</h1>
        <p>研究課題の初期情報を入力し、利用するDMPテンプレートを選択します。</p>
      </section>

      <form className="card project-form">
        <label>
          研究課題名
          <input name="title" type="text" placeholder="例: 研究データ管理支援ツールの実証研究" />
        </label>
        <label>
          研究分野
          <input name="field" type="text" placeholder="例: 情報学" />
        </label>
        <label>
          DMPテンプレート
          <select name="templateId" defaultValue={defaultTemplateId}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} / {template.questionCount}項目 / v{template.version}
              </option>
            ))}
          </select>
        </label>
        <p className="form-note">
          テンプレート選択は後続タスクのDMP入力フォーム生成で利用します。
        </p>
        <Link className="secondary-button" href="/dmp/editor">
          DMP入力へ進む
        </Link>
      </form>
    </AppShell>
  );
}
