import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

export default async function RespiratoryPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const respiratory = patient.respiratory ?? [];
  const p = patient as any;

  const isVentilated = respiratory.some((r) =>
    ["intubated", "ett", "trach", "ventilat", "mechanical"].some((kw) =>
      r.device.toLowerCase().includes(kw) || r.mode.toLowerCase().includes(kw)
    )
  );

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Respiratory / Ventilator">

      {/* Status banner */}
      <div className="card" style={{
        background: isVentilated ? "#fff7f7" : "#f0fdf4",
        borderColor: isVentilated ? "#fca5a5" : "#bbf7d0"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.5rem" }}>{isVentilated ? "🫁" : "💨"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {isVentilated ? "Mechanically Ventilated" : "Spontaneous / Supplemental O₂"}
            </div>
            <div className="muted" style={{ fontSize: "0.875rem" }}>
              SpO₂: {patient.vitals.oxygen_saturation}% · HR: {patient.vitals.heart_rate} bpm
            </div>
          </div>
        </div>
      </div>

      {/* Current devices */}
      <div className="card">
        <h3 className="section-title">Airway & Respiratory Support</h3>
        {respiratory.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr><th>Device / Airway</th><th>Mode / Position</th><th>Details</th></tr>
              </thead>
              <tbody>
                {respiratory.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.device}</strong></td>
                    <td>{r.mode}</td>
                    <td className="muted">{r.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No respiratory care records for this patient.</p>
        )}
      </div>

      {/* Key vent parameters (if ventilated) */}
      {isVentilated && (
        <div className="card">
          <h3 className="section-title">Key Ventilator Parameters</h3>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {[
              ["FiO₂", "—"],
              ["PEEP", "—"],
              ["Tidal Volume", "—"],
              ["RR (set)", "—"],
              ["Peak Pressure", "—"],
              ["MV", "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{val}</div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: "0.85rem" }}>
            Detailed ventilator parameters are available in the <strong>respiratoryCharting</strong> table.
          </p>
        </div>
      )}

      {/* Respiratory vitals */}
      <div className="card">
        <h3 className="section-title">Respiratory Vitals</h3>
        <div className="grid grid-2" style={{ gap: 10 }}>
          {[
            { label: "SpO₂", value: `${patient.vitals.oxygen_saturation}%`, ok: patient.vitals.oxygen_saturation >= 94 },
            { label: "Temperature", value: `${patient.vitals.temperature_c} °C`, ok: patient.vitals.temperature_c <= 38.5 },
          ].map((v) => (
            <div key={v.label} className="card" style={{ borderColor: v.ok ? "#e2e8f0" : "#fca5a5" }}>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{v.label}</div>
              <div className="stat" style={{ color: v.ok ? "#0f172a" : "#dc2626" }}>{v.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Data Sources</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          <strong>respiratoryCare</strong> (airway type, vent start/end, settings limits) ·{" "}
          <strong>respiratoryCharting</strong> (176k rows of charted vent parameters) ·{" "}
          <strong>apacheApsVar</strong> (intubated/vent flag) ·{" "}
          <strong>apachePredVar</strong> (ventday1, oobventday1).
          Full parameter trending (FiO₂, PEEP, PIP, TV, MV, ETCO₂) requires parsing <code>respchartvaluelabel</code>.
        </p>
      </div>

    </PatientPageShell>
  );
}
