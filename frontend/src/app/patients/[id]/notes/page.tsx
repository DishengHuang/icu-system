import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";
import { ClinicianNotesManagement } from "@/components/clinician-notes-management";
import { patientEicuStyleNoteAuthor, patientEicuStyleNoteType } from "@/lib/eicu-note-display";

const NOTE_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  "Progress Note": { bg: "#eff6ff", color: "#1d4ed8" },
  "Comprehensive Progress": { bg: "#eff6ff", color: "#1d4ed8" },
  "Procedure Note": { bg: "#eff6ff", color: "#1d4ed8" },
  "Nursing Note": { bg: "#f0fdf4", color: "#166534" },
  "Admission Note": { bg: "#fdf4ff", color: "#7e22ce" },
  "Discharge Note": { bg: "#fff7ed", color: "#9a3412" },
  "Consult": { bg: "#f0f9ff", color: "#0369a1" },
  "Consult Note": { bg: "#f0f9ff", color: "#0369a1" },
};

function noteStyle(type: string) {
  return NOTE_TYPE_COLOR[type] ?? { bg: "#f8fafc", color: "#334155" };
}

export default async function NotesPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const allNotes = patient.notes ?? [];
  const eicuNotes = allNotes.filter((n) => n._source !== "clinical");
  const clinicalNotes = allNotes.filter((n) => n._source === "clinical");

  const byType: Record<string, typeof eicuNotes> = {};
  for (const note of eicuNotes) {
    const t = patientEicuStyleNoteType(note) || "Other";
    if (!byType[t]) byType[t] = [];
    byType[t].push(note);
  }

  const types = Object.keys(byType);

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Clinical Notes & Documentation">

      <ClinicianNotesManagement patientId={params.id} initial={clinicalNotes} />

      {/* Note type summary — eICU `note` rows only */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {types.map((t) => {
          const s = noteStyle(t);
          return (
            <div key={t} style={{ padding: "8px 16px", borderRadius: 8, background: s.bg, color: s.color, fontWeight: 600, fontSize: "0.875rem" }}>
              {t} ({byType[t].length})
            </div>
          );
        })}
        {eicuNotes.length === 0 && <p className="muted">No eICU notes on record.</p>}
      </div>

      {/* Notes by type — eICU `note` rows only */}
      {types.map((t) => (
        <div key={t} className="card">
          <h3 className="section-title" style={{ color: noteStyle(t).color, marginBottom: 8 }}>{t}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byType[t].map((note) => {
              const typeLabel = patientEicuStyleNoteType(note);
              const authorLabel = patientEicuStyleNoteAuthor(note);
              const s = noteStyle(typeLabel);
              const sameTypeAsSection = typeLabel.trim() === t.trim();
              const showTypeChip = !sameTypeAsSection;
              const hasMetaRow = Boolean(authorLabel) || showTypeChip;
              return (
              <div key={note.id} style={{ padding: "10px 12px", borderRadius: 8, background: s.bg, border: `1px solid ${s.bg}` }}>
                {hasMetaRow ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                      justifyContent:
                        authorLabel && showTypeChip ? "space-between" : "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    {authorLabel ? (
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{authorLabel}</span>
                    ) : null}
                    {showTypeChip ? (
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.7)", color: s.color }}>
                        {typeLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.5, fontSize: "0.9rem" }}>{note.content}</p>
              </div>
            );
            })}
          </div>
        </div>
      ))}

      {eicuNotes.length === 0 && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>No eICU note text recorded for this patient stay (limited sample).</p>
        </div>
      )}

    </PatientPageShell>
  );
}
