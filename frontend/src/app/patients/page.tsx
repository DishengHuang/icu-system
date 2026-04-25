import Link from "next/link";
import { getPatients } from "@/services/api";

export default async function PatientsPage() {
  const patients = await getPatients();
  return (
    <main className="card">
      <h1 className="section-title">Patient List / ICU Census</h1>
      <p className="muted">Select a patient to open their full workspace.</p>
      <div className="patient-list">
        {patients.map((p) => (
          <div key={p.id} className="patient-row">
            <div>
              <strong>{p.full_name}</strong>
              <div className="muted" style={{ fontSize: "0.85rem" }}>#{p.display_id} · {p.room} · {p.age}y {p.gender}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{p.primary_diagnosis}</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className={`dashboard-status ${p.clinical_status === "Critical" ? "dashboard-status--critical" : "dashboard-status--stable"}`}>
                {p.clinical_status}
              </span>
              <Link href={`/patients/${p.id}/summary`} className="dashboard-link">Open →</Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
