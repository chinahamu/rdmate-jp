import type { Metadata } from 'next';
import './globals.css';
import './global-extra.css';
import './access-control.css';
import './audit-history.css';
import './data-protection.css';

export const metadata: Metadata = {
  title: 'RDMate JP',
  description: '日本語で研究データ管理計画を作成するためのOSSアプリケーション',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
