import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

const PANELS: Record<string, string[]> = {
  "CBC": ["WBC", "Hgb", "Hct", "Platelets", "RBC", "-lymphs", "-monos", "-basos", "-eos", "-polys"],
  "BMP / CMP": ["Sodium", "Potassium", "Chloride", "Bicarbonate", "BUN", "Creatinine", "Glucose", "Calcium", "Total Bilirubin", "ALT (SGPT)", "AST (SGOT)", "Alkaline Phosphate"],
  "ABG / Respiratory": ["pH", "pO2", "pCO2", "Base Excess", "Bicarbonate", "FiO2"],
  "Coagulation": ["PT - INR", "PTT", "Fibrinogen"],
  "Cardiac": ["Troponin", "BNP", "CK"],
  "Other": [],
};

function flagColor(status: string) {
  if (status === "High") return { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  if (status === "Low") return { bg: "#fef9c3", color: "#92400e", border: "#fde68a" };
  return { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" };
}

export default async function LabsPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const p = patient as any;
  const labs: any[] = patient.labs ?? [];
  const microLabs: any[] = p.microLabs ?? [];

  // Partition labs into panels
  const panelMap: Record<string, any[]> = {};
  const used = new Set<string>();

  for (const [panel, names] of Object.entries(PANELS)) {
    panelMap[panel] = labs.filter((l) => names.includes(l.name));
    panelMap[panel].forEach((l) => used.add(l.name));
  }
  panelMap["Other"] = labs.filter((l) => !used.has(l.name));

  const abnormal = labs.filter((l) => l.status !== "Normal");

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Laboratory Results">

      {/* Abnormal flag banner */}
      {abnormal.length > 0 && (
        <div className="alert-box">
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div>
            <strong>Abnormal results:</strong>{" "}
            <span className="muted">{abnormal.map((l) => l.name).join(", ")}</span>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="grid grid-2" style={{ gap: 10 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: "0.85rem" }}>Total Lab Results</div>
          <div className="stat">{labs.length}</div>
        </div>
        <div className="card" style={{ borderColor: abnormal.length > 0 ? "#fca5a5" : "#e2e8f0" }}>
          <div className="muted" style={{ fontSize: "0.85rem" }}>Abnormal Flags</div>
          <div className="stat" style={{ color: abnormal.length > 0 ? "#dc2626" : "#166534" }}>{abnormal.length}</div>
        </div>
      </div>

      {/* Panels */}
      {Object.entries(panelMap).map(([panel, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={panel} className="card">
            <h3 className="section-title">{panel}</h3>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((lab) => {
                    const fc = flagColor(lab.status);
                    return (
                      <tr key={lab.id}>
                        <td><strong>{lab.name}</strong></td>
                        <td style={{ fontWeight: 600 }}>{lab.value}</td>
                        <td>
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}` }}>
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Microbiology */}
      <div className="card">
        <h3 className="section-title">Microbiology / Culture Results</h3>
        {microLabs.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Culture Site</th><th>Organism</th><th>Antibiotic</th><th>Sensitivity</th></tr></thead>
              <tbody>
                {microLabs.map((m: any, i: number) => (
                  <tr key={i}>
                    <td>{m.culturesite}</td>
                    <td><strong>{m.organism}</strong></td>
                    <td>{m.antibiotic ?? "—"}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: m.sensitivitylevel === "Sensitive" ? "#16a34a" : m.sensitivitylevel === "Resistant" ? "#dc2626" : "#92400e" }}>
                        {m.sensitivitylevel ?? "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No microbiology results on record for this patient.</p>
        )}
      </div>

    </PatientPageShell>
  );
}
