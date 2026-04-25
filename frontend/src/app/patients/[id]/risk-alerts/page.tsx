import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

function RiskMeter({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value.toFixed(1)}{max === 100 ? "%" : ""}</span>
      </div>
      <div style={{ background: "#e2e8f0", height: 12, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function riskColor(val: number, thresholds: [number, number]) {
  if (val >= thresholds[1]) return "#dc2626";
  if (val >= thresholds[0]) return "#d97706";
  return "#16a34a";
}

export default async function RiskAlertsPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const p = patient as any;
  const apache = p.apache ?? {};

  const icuMort = apache.predicted_icu_mortality != null ? apache.predicted_icu_mortality * 100 : null;
  const hospMort = icuMort != null ? icuMort * 1.15 : null; // estimated
  const icuLos = apache.predicted_icu_los ?? null;
  const hospLos = icuLos != null ? icuLos * 2.5 : null;
  const apacheScore = apache.score ?? null;

  const overallRisk = patient.clinical_status === "Critical" ? "High" : icuMort != null && icuMort > 15 ? "Moderate" : "Low";
  const riskBg = overallRisk === "High" ? "#fff7f7" : overallRisk === "Moderate" ? "#fff7ed" : "#f0fdf4";
  const riskBorder = overallRisk === "High" ? "#fca5a5" : overallRisk === "Moderate" ? "#fed7aa" : "#bbf7d0";
  const riskTextColor = overallRisk === "High" ? "#b91c1c" : overallRisk === "Moderate" ? "#c2410c" : "#166534";

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Severity & Risk Prediction">

      {/* Overall risk banner */}
      <div className="card" style={{ background: riskBg, borderColor: riskBorder }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Risk Level</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: riskTextColor }}>{overallRisk} Risk</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ fontSize: "0.875rem" }}>Clinical Status</div>
            <span className={`dashboard-status ${patient.clinical_status === "Critical" ? "dashboard-status--critical" : "dashboard-status--stable"}`} style={{ fontSize: "1rem" }}>
              {patient.clinical_status}
            </span>
          </div>
        </div>
      </div>

      {/* APACHE Score */}
      <div className="card">
        <h3 className="section-title">APACHE Score</h3>
        {apacheScore != null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: riskColor(apacheScore, [40, 70]) }}>
              {apacheScore}
            </div>
            <div>
              <div className="muted">APACHE II / IV Score</div>
              <div style={{ fontWeight: 600, color: riskColor(apacheScore, [40, 70]) }}>
                {apacheScore < 15 ? "Low severity" : apacheScore < 40 ? "Moderate severity" : "High severity"}
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">No APACHE score available for this patient encounter.</p>
        )}
      </div>

      {/* Predicted outcomes */}
      {(icuMort != null || icuLos != null) && (
        <div className="card">
          <h3 className="section-title">Predicted Outcomes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {icuMort != null && (
              <RiskMeter value={icuMort} max={100} label="Predicted ICU Mortality" color={riskColor(icuMort, [15, 30])} />
            )}
            {hospMort != null && (
              <RiskMeter value={Math.min(hospMort, 100)} max={100} label="Predicted Hospital Mortality (estimated)" color={riskColor(hospMort, [20, 40])} />
            )}
            {icuLos != null && (
              <RiskMeter value={icuLos} max={30} label={`Predicted ICU LOS: ${icuLos.toFixed(1)} days`} color={riskColor(icuLos, [7, 14])} />
            )}
            {hospLos != null && (
              <RiskMeter value={hospLos} max={60} label={`Predicted Hospital LOS: ${hospLos.toFixed(1)} days`} color={riskColor(hospLos, [14, 28])} />
            )}
          </div>
        </div>
      )}

      {/* Active risk flags */}
      <div className="card">
        <h3 className="section-title">Active Risk Alerts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            patient.vitals.heart_rate > 100 && `Tachycardia (HR ${patient.vitals.heart_rate} bpm)`,
            patient.vitals.oxygen_saturation < 94 && `Hypoxemia (SpO₂ ${patient.vitals.oxygen_saturation}%)`,
            patient.vitals.temperature_c > 38.5 && `Fever (${patient.vitals.temperature_c} °C)`,
            patient.clinical_status === "Critical" && "High-acuity ICU patient",
            (icuMort ?? 0) > 30 && "Predicted ICU mortality > 30%",
          ].filter(Boolean).map((alert, i) => (
            <div key={i} className="alert-box">
              <span>🔴</span>
              <span style={{ fontWeight: 600 }}>{alert as string}</span>
            </div>
          ))}
          {[
            patient.vitals.heart_rate > 100,
            patient.vitals.oxygen_saturation < 94,
            patient.vitals.temperature_c > 38.5,
            patient.clinical_status === "Critical",
            (icuMort ?? 0) > 30,
          ].every((x) => !x) && (
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span style={{ color: "#166534", fontWeight: 600 }}>✓ No active critical alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* Data sources */}
      <div className="card">
        <h3 className="section-title">Data Sources</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          <strong>apachePatientResult</strong> — APACHE score, predicted ICU/hospital mortality, actual outcomes, LOS.{" "}
          <strong>apacheApsVar</strong> — Physiology variables (GCS, urine, WBC, temp, HR, BP, pH, creatinine, etc.).{" "}
          <strong>apachePredVar</strong> — Admission prediction variables (age, comorbidities, surgery type, ventilation).
        </p>
      </div>

    </PatientPageShell>
  );
}
