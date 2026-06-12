import type { ReactNode } from 'react';

export function TopBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="admin-topbar">
      <h1>{title}</h1>
      {children}
    </header>
  );
}
