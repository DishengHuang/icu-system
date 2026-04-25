import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

export default async function NursingPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const nurses = patient.assigned_nurses ?? [];

  const nursingNotes = (patient.notes ?? []).filter((n) =>
    n.note_type?.toLowerCase().includes("nurs")
  );

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Nursing Documentation">

      {/* Assigned nurses */}
      <div className="card">
        <h3 className="section-title">Assigned Nursing Staff</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {nurses.map((n) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: "1.25rem" }}>👩‍⚕️</span>
              <span style={{ fontWeight: 600 }}>{n}</span>
            </div>
          ))}
          {nurses.length === 0 && <p className="muted">No assigned nurses on record.</p>}
        </div>
      </div>

      {/* Nursing notes */}
      <div className="card">
        <h3 className="section-title">Nursing Notes ({nursingNotes.length})</h3>
        {nursingNotes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {nursingNotes.map((note) => (
              <div key={note.id} style={{ padding: "12px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{note.author}</div>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, fontSize: "0.925rem" }}>{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No nursing notes recorded. Data sourced from <strong>nurseCharting</strong>, <strong>nurseAssessment</strong>, and <strong>nurseCare</strong> tables.</p>
        )}
      </div>

      {/* Nursing assessment categories */}
      <div className="card">
        <h3 className="section-title">Assessment Areas (eICU Data)</h3>
        <div className="grid grid-2" style={{ gap: 10 }}>
          {[
            { area: "Neurological", desc: "Level of consciousness, GCS, orientation" },
            { area: "Cardiovascular", desc: "Heart rate, rhythm, peripheral perfusion" },
            { area: "Respiratory", desc: "Breathing pattern, O₂ requirement, secretions" },
            { area: "Renal / GU", desc: "Urine output, catheter status, color" },
            { area: "GI / Nutrition", desc: "Bowel sounds, tube feeding, oral intake" },
            { area: "Skin / Wound", desc: "Pressure ulcer risk, wound status, line sites" },
            { area: "Pain / Sedation", desc: "Pain score, sedation level, comfort measures" },
            { area: "Mobility / Fall risk", desc: "Mobility status, fall prevention measures" },
          ].map((item) => (
            <div key={item.area} style={{ padding: "12px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.area}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          Data from <strong>nurseAssessment</strong> (91,589 rows), <strong>nurseCare</strong> (42,080 rows),
          and <strong>nurseCharting</strong> (1.47M rows). Full implementation parses <code>cellattributepath</code>
          to render structured nursing observation overviews and trend notes.
        </p>
      </div>

    </PatientPageShell>
  );
}
