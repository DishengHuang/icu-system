import Link from "next/link";
import { getPatients } from "@/services/api";
import { computeDashboardStats } from "@/lib/demo-clinical";

export default async function DashboardPage() {
  const patients = await getPatients();
  const stats = computeDashboardStats(patients);

  return (
    <main className="dashboard-main">
      <div className="dashboard-stats" style={{ maxWidth: "100%", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {[
          { label: "ICU Census",      value: stats.total },
          { label: "Critical",        value: stats.critical,  danger: stats.critical > 0 },
          { label: "Avg Heart Rate",  value: `${stats.avgHr} bpm` },
          { label: "Low SpO₂",        value: stats.lowSpO2,   danger: stats.lowSpO2 > 0 },
        ].map((c) => (
          <div key={c.label} className="dashboard-stat-card" style={{ borderColor: (c as any).danger ? "#fca5a5" : "#e2e8f0" }}>
            <div className="dashboard-stat-label">{c.label}</div>
            <div className="dashboard-stat-value" style={{ color: (c as any).danger ? "#dc2626" : "#0f172a" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">Clinical entry points</h2>
          <div className="quick-links">
            <Link href="/patients" className="dashboard-search-btn">Open Patient List</Link>
            <Link href="/admin" className="secondary-btn">Hospital Dashboard</Link>
          </div>
        </div>
        <div className="card">
          <h2 className="section-title">System overview</h2>
          <ul className="muted">
            <li>31 eICU tables loaded into SQLite</li>
            <li>Gemini-powered clinical assistant per patient</li>
            <li>15 pages across full ICU workflow</li>
          </ul>
        </div>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr><th>Patient</th><th>Diagnosis</th><th>Status</th><th>HR</th><th>SpO₂</th><th>Action</th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.full_name}</strong>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>#{p.display_id} · {p.room}</div>
                </td>
                <td>{p.primary_diagnosis}</td>
                <td>
                  <span className={`dashboard-status ${p.clinical_status === "Critical" ? "dashboard-status--critical" : "dashboard-status--stable"}`}>
                    {p.clinical_status}
                  </span>
                </td>
                <td>{p.latest_hr > 0 ? p.latest_hr.toFixed(0) : "—"}</td>
                <td>{p.latest_spo2 > 0 ? `${p.latest_spo2.toFixed(0)}%` : "—"}</td>
                <td><Link href={`/patients/${p.id}/summary`} className="dashboard-link">Open →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
