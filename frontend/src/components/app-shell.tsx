import Link from "next/link";
import { ReactNode } from "react";

type NavItem = { href: string; label: string };

export function AppShell({ title, subtitle, children, navItems }: { title: string; subtitle?: string; children: ReactNode; navItems: NavItem[]; }) {
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div>
          <div className="portal-brand">eICU System</div>
          <div className="portal-subbrand">Full-stack clinical app</div>
        </div>
        <nav className="portal-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="portal-nav-link">{item.label}</Link>
          ))}
        </nav>
      </aside>
      <main className="portal-main">
        <div className="portal-page-header">
          <div>
            <h1 className="portal-title">{title}</h1>
            {subtitle ? <p className="portal-subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
