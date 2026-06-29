import Link from 'next/link';

type AppShellProps = Readonly<{
  children: React.ReactNode;
}>;

const navigationItems = [
  { href: '/', label: 'ホーム' },
  { href: '/projects/new', label: '研究課題' },
  { href: '/dmp/editor', label: 'DMP入力' },
  { href: '/dmp/quality', label: 'DMPチェック' },
  { href: '/dmp/funder-check', label: '助成機関チェック' },
  { href: '/dmp/export', label: 'DMP出力' },
  { href: '/datasets', label: 'データセット台帳' },
  { href: '/storage', label: '保存場所管理' },
  { href: '/metadata', label: 'メタデータ管理' },
  { href: '/identifiers', label: '外部識別子' },
  { href: '/integrations/gakunin-rdm', label: 'GakuNin RDM連携' },
  { href: '/repository-exports', label: 'リポジトリ出力' },
  { href: '/code-repositories', label: 'GitHub/GitLab連携' },
  { href: '/publication-license', label: '公開・ライセンス' },
  { href: '/dmp-diff', label: 'DMP差分' },
  { href: '/related-outputs', label: '関連成果物' },
  { href: '/import-export', label: '入出力' },
  { href: '/access-control', label: '権限管理' },
  { href: '/audit-history', label: '監査履歴' },
  { href: '/data-protection', label: 'データ保護' },
  { href: '/japanese-institution', label: '日本向け設定' },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="app-header__brand" href="/">
            RDMate JP
          </Link>
          <nav className="app-header__nav" aria-label="主要ナビゲーション">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
