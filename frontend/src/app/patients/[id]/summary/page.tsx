import Link from "next/link";
import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

export default async function SummaryPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const p = patient as any;
  const apache = p.apache ?? {};

  const riskColor =
    apache.predicted_icu_mortality > 0.3
      ? "dashboard-status--critical"
      : "dashboard-status--stable";

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name}
      subtitle={`${patient.mrn} · ${patient.room} · ${patient.age}y ${patient.gender}`}>

      {/* Hero banner */}
      <div className="card" style={{ background: patient.clinical_status === "Critical" ? "#fff7f7" : "#f0fdf4", borderColor: patient.clinical_status === "Critical" ? "#fecaca" : "#bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>{patient.full_name}</h2>
            <p className="muted" style={{ margin: 0 }}>{patient.primary_diagnosis}</p>
          </div>
          <span className={`dashboard-status ${riskColor}`} style={{ fontSize: "1rem", padding: "8px 18px" }}>
            {patient.clinical_status}
          </span>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Patient info */}
        <div className="card">
          <h3 className="section-title">Patient Information</h3>
          <dl className="patient-detail-dl">
            {[
              ["Patient ID", patient.display_id],
              ["MRN", patient.mrn],
              ["Age", `${patient.age} years`],
              ["Gender", patient.gender],
              ["Unit / Room", patient.room],
              ["Primary Diagnosis", patient.primary_diagnosis],
            ].map(([k, v]) => (
              <div key={String(k)} className="patient-detail-dl-row">
                <dt>{k}</dt><dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Current vitals snapshot */}
        <div className="card">
          <h3 className="section-title">Current Vitals</h3>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {[
              ["Heart Rate", `${patient.vitals.heart_rate} bpm`],
              ["Blood Pressure", patient.vitals.blood_pressure],
              ["SpO₂", `${patient.vitals.oxygen_saturation}%`],
              ["Temperature", `${patient.vitals.temperature_c} °C`],
            ].map(([label, val]) => (
              <div key={String(label)} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{label}</div>
                <div className="stat" style={{ fontSize: "1.25rem" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href={`/patients/${params.id}/vitals`} className="dashboard-link" style={{ fontSize: "0.9rem" }}>
              View full vitals trend →
            </Link>
          </div>
        </div>

        {/* APACHE / Risk */}
        <div className="card">
          <h3 className="section-title">Severity Score (APACHE)</h3>
          {apache.score != null ? (
            <dl className="patient-detail-dl">
              {[
                ["APACHE Score", apache.score],
                ["Predicted ICU Mortality", apache.predicted_icu_mortality != null ? `${(apache.predicted_icu_mortality * 100).toFixed(1)}%` : "—"],
                ["Predicted ICU LOS", apache.predicted_icu_los != null ? `${Number(apache.predicted_icu_los).toFixed(1)} days` : "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="patient-detail-dl-row">
                  <dt>{k}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">No APACHE data available.</p>
          )}
          <div style={{ marginTop: 14 }}>
            <Link href={`/patients/${params.id}/risk-alerts`} className="dashboard-link" style={{ fontSize: "0.9rem" }}>
              View full risk analysis →
            </Link>
          </div>
        </div>

        {/* Admission Diagnoses */}
        <div className="card">
          <h3 className="section-title">Active Diagnoses</h3>
          {patient.diagnoses && patient.diagnoses.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {patient.diagnoses.slice(0, 5).map((d: any) => (
                <li key={d.id}>
                  <span style={{ fontWeight: 600 }}>{d.diagnosis}</span>
                  <span className="muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>{d.status}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No diagnoses recorded.</p>}
        </div>

        {/* Allergies */}
        <div className="card">
          <h3 className="section-title">Allergies</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(patient.allergies ?? []).map((a: string) => (
              <span key={a} style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: 999, fontSize: "0.875rem", fontWeight: 600 }}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Treatments */}
        <div className="card">
          <h3 className="section-title">Active Treatments</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {(patient.treatments ?? []).slice(0, 8).map((t: string) => (
              <li key={t} className="muted">{t}</li>
            ))}
          </ul>
        </div>

        {/* Fluid balance */}
        <div className="card">
          <h3 className="section-title">Fluid Balance (24h)</h3>
          {patient.intake_output && patient.intake_output[0] ? (() => {
            const io = patient.intake_output[0];
            const net = io.net_ml;
            return (
              <dl className="patient-detail-dl">
                {[["Total Intake", `${io.intake_ml.toLocaleString()} mL`], ["Total Output", `${io.output_ml.toLocaleString()} mL`], ["Net Balance", `${net > 0 ? "+" : ""}${net.toLocaleString()} mL`]].map(([k, v]) => (
                  <div key={String(k)} className="patient-detail-dl-row">
                    <dt>{k}</dt>
                    <dd style={{ color: net > 500 ? "#b91c1c" : net < -500 ? "#92400e" : "#166534", fontWeight: 700 }}>{v}</dd>
                  </div>
                ))}
              </dl>
            );
          })() : <p className="muted">No I/O data.</p>}
        </div>

        {/* Care providers */}
        <div className="card">
          <h3 className="section-title">Care Team</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {(patient.care_providers ?? []).map((cp: any, i: number) => (
              <li key={i}><span className="muted">{cp.role}:</span> <strong>{cp.name}</strong></li>
            ))}
            {(patient.assigned_nurses ?? []).map((n: string) => (
              <li key={n}><span className="muted">Nurse:</span> <strong>{n}</strong></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Past medical history */}
      <div className="card">
        <h3 className="section-title">Past Medical History</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(patient.past_medical_history ?? []).map((h: string) => (
            <span key={h} className="badge">{h}</span>
          ))}
        </div>
      </div>
    </PatientPageShell>
  );
}
