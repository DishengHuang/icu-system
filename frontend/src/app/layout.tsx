import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "eICU Full-Stack App",
  description: "FastAPI + Next.js ICU information system scaffold",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav">
          <div className="top-nav-inner">
            <Link href="/dashboard" className="top-nav-brand">eICU System</Link>
            <nav className="top-nav-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/patients">Patient List</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/login">Logout</Link>
            </nav>
          </div>
        </header>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
