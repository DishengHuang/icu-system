import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";
import { DiagnosisManagement } from "@/components/diagnosis-management";

export default async function DiagnosisPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const diagnoses = patient.diagnoses ?? [];
  const eicuDiagnoses = diagnoses.filter((d) => d._source !== "clinical");
  const clinicalDiagnoses = diagnoses.filter((d) => d._source === "clinical");
  const active = eicuDiagnoses.filter((d) => d.status === "Active" || d.status === "Confirmed");
  const resolved = eicuDiagnoses.filter((d) => d.status !== "Active" && d.status !== "Confirmed");

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Diagnosis / Problem List">

      {/* Primary diagnosis */}
      <div className="card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
        <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Primary / Admission Diagnosis</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{patient.primary_diagnosis}</div>
      </div>

      <DiagnosisManagement patientId={params.id} initial={clinicalDiagnoses} />

      {/* eICU-derived diagnoses (read-only) */}
      <div className="card">
        <h3 className="section-title">eICU problem list – active ({active.length})</h3>
        {active.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr><th>#</th><th>Diagnosis</th><th>Status</th><th>Clinician</th></tr>
              </thead>
              <tbody>
                {active.map((d, i) => (
                  <tr key={d.id}>
                    <td className="muted">{i + 1}</td>
                    <td><strong>{d.diagnosis}</strong></td>
                    <td>
                      <span className="dashboard-status dashboard-status--critical" style={{ fontSize: "0.78rem" }}>
                        {d.status}
                      </span>
                    </td>
                    <td className="muted">{d.clinician}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No active eICU diagnoses on record.</p>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="card">
          <h3 className="section-title">eICU problem list – resolved / historical ({resolved.length})</h3>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr><th>Diagnosis</th><th>Status</th></tr>
              </thead>
              <tbody>
                {resolved.map((d) => (
                  <tr key={d.id}>
                    <td>{d.diagnosis}</td>
                    <td><span className="dashboard-status dashboard-status--stable" style={{ fontSize: "0.78rem" }}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past medical history */}
      <div className="card">
        <h3 className="section-title">Past Medical History</h3>
        {(patient.past_medical_history ?? []).length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {patient.past_medical_history.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No past medical history recorded.</p>
        )}
      </div>

      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          eICU tables are read-only in this app. <strong>Clinical problem list</strong> entries are saved locally in
          the app database as an overlay and do not modify the original eICU extract.
        </p>
      </div>

    </PatientPageShell>
  );
}
