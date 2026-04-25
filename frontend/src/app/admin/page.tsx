import { getPatients } from "@/services/api";
import { computeDashboardStats } from "@/lib/demo-clinical";

export default async function AdminPage() {
  const patients = await getPatients();
  const stats = computeDashboardStats(patients);

  const unitGroups: Record<string, typeof patients> = {};
  for (const p of patients) {
    const unit = p.room.split(" ")[0] ?? "ICU";
    if (!unitGroups[unit]) unitGroups[unit] = [];
    unitGroups[unit].push(p);
  }

  const ventCount = patients.filter((p) => p.clinical_status === "Critical").length;
  const avgHr = stats.avgHr;

  return (
    <main className="dashboard-main">
      <h1 className="section-title" style={{ fontSize: "1.5rem", marginBottom: 4 }}>Hospital / Unit Dashboard</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Administrative view — census, acuity, and operational summary across all ICU units.</p>

      {/* Top stats */}
      <div className="dashboard-stats" style={{ maxWidth: "100%", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {[
          { label: "ICU Census", value: stats.total, hint: "Active patients" },
          { label: "Critical", value: stats.critical, hint: "High acuity", danger: stats.critical > 0 },
          { label: "Avg Heart Rate", value: `${avgHr} bpm`, hint: "Across census" },
          { label: "Low SpO₂", value: stats.lowSpO2, hint: "SpO₂ ≤ 92%", danger: stats.lowSpO2 > 0 },
          { label: "Units Active", value: Object.keys(unitGroups).length, hint: "ICU sub-units" },
          { label: "Ventilated (est.)", value: ventCount, hint: "Critical patients", danger: ventCount > 0 },
        ].map((card) => (
          <div key={card.label} className="dashboard-stat-card" style={{ borderColor: (card as any).danger ? "#fca5a5" : "#e2e8f0" }}>
            <div className="dashboard-stat-label">{card.label}</div>
            <div className="dashboard-stat-value" style={{ color: (card as any).danger ? "#dc2626" : "#0f172a" }}>{card.value}</div>
            <div className="muted" style={{ marginTop: 4, fontSize: "0.8rem" }}>{card.hint}</div>
          </div>
        ))}
      </div>

      {/* By unit breakdown */}
      <div className="card">
        <h2 className="section-title">Census by ICU Unit</h2>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Patients</th>
                <th>Critical</th>
                <th>Avg HR</th>
                <th>Low SpO₂</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(unitGroups).map(([unit, pts]) => {
                const crit = pts.filter((p) => p.clinical_status === "Critical").length;
                const unitAvgHr = pts.length ? Math.round(pts.reduce((s, p) => s + (p.latest_hr ?? 0), 0) / pts.length) : 0;
                const lowO2 = pts.filter((p) => (p.latest_spo2 ?? 100) <= 92).length;
                return (
                  <tr key={unit}>
                    <td><strong>{unit}</strong></td>
                    <td>{pts.length}</td>
                    <td style={{ color: crit > 0 ? "#dc2626" : "#166534", fontWeight: 600 }}>{crit}</td>
                    <td>{unitAvgHr} bpm</td>
                    <td style={{ color: lowO2 > 0 ? "#dc2626" : "#166534", fontWeight: 600 }}>{lowO2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full patient table */}
      <div className="card">
        <h2 className="section-title">All Patients</h2>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr><th>Patient</th><th>Unit</th><th>Diagnosis</th><th>Status</th><th>HR</th><th>SpO₂</th></tr>
            </thead>
            <tbody>
              {patients.slice(0, 50).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>{p.mrn} · {p.age}y {p.gender}</div>
                  </td>
                  <td className="muted">{p.room}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.primary_diagnosis}</td>
                  <td><span className={`dashboard-status ${p.clinical_status === "Critical" ? "dashboard-status--critical" : "dashboard-status--stable"}`}>{p.clinical_status}</span></td>
                  <td>{p.latest_hr > 0 ? p.latest_hr.toFixed(0) : "—"}</td>
                  <td>{p.latest_spo2 > 0 ? `${p.latest_spo2.toFixed(0)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {patients.length > 50 && (
          <p className="muted" style={{ marginTop: 12, fontSize: "0.875rem" }}>Showing 50 of {patients.length} patients.</p>
        )}
      </div>

    </main>
  );
}
