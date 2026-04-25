import { ReactNode } from "react";

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string; }) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-label">{label}</div>
      <div className="dashboard-stat-value">{value}</div>
      {hint ? <div className="muted" style={{ marginTop: 8 }}>{hint}</div> : null}
    </div>
  );
}

export function Pill({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "danger" | "success" | "warning"; }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
