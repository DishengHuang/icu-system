import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";
import { DrugManagement } from "@/components/drug-management";

export default async function MedicationsPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const meds = patient.medications ?? [];
  const infusions = patient.infusions ?? [];
  const allergies = patient.allergies ?? [];

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Medications & Infusions">

      {/* Allergy list */}
      <div className="card">
        <h3 className="section-title">Known Allergies</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allergies.map((a) => (
            <span key={a} style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: 999, fontSize: "0.875rem", fontWeight: 600 }}>
              ⚠ {a}
            </span>
          ))}
        </div>
      </div>

      <DrugManagement
        patientId={params.id}
        initialMedications={meds}
        initialInfusions={infusions}
        allergies={allergies}
      />

      {/* Past medical history context */}
      <div className="card">
        <h3 className="section-title">Past Medical History (context for prescribing)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(patient.past_medical_history ?? []).map((h) => (
            <span key={h} className="badge">{h}</span>
          ))}
        </div>
      </div>

    </PatientPageShell>
  );
}
