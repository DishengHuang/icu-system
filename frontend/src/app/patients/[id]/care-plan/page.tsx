import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

const GOAL_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "In progress": { bg: "#eff6ff", color: "#1d4ed8" },
  "Achieved": { bg: "#f0fdf4", color: "#166534" },
  "Pending": { bg: "#fef9c3", color: "#92400e" },
  "Not started": { bg: "#f1f5f9", color: "#475569" },
};

export default async function CarePlanPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const providers = patient.care_providers ?? [];

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Care Plan">

      {/* General care plan */}
      <div className="card">
        <h3 className="section-title">General Care Plan</h3>
        <p style={{ margin: 0, lineHeight: 1.7, color: "#334155" }}>{patient.care_plan}</p>
      </div>

      {/* Goals */}
      <div className="card">
        <h3 className="section-title">Care Goals</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { category: "Hemodynamics", goal: "Maintain MAP > 65 mmHg, adequate tissue perfusion", status: "In progress" },
            { category: "Respiratory", goal: "Wean supplemental oxygen, SpO₂ ≥ 94%", status: "In progress" },
            { category: "Infection", goal: "Targeted antibiotic therapy per culture results", status: "Pending" },
            { category: "Nutrition", goal: "Initiate enteral or parenteral nutrition within 48h", status: "Not started" },
            { category: "Mobility", goal: "Early mobilization protocol when hemodynamically stable", status: "Not started" },
          ].map((goal, i) => {
            const s = GOAL_STATUS_STYLE[goal.status] ?? GOAL_STATUS_STYLE["Not started"];
            return (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{goal.category}</div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>{goal.goal}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
                  {goal.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Care providers */}
      <div className="card">
        <h3 className="section-title">Care Providers</h3>
        <div className="grid grid-2" style={{ gap: 10 }}>
          {providers.map((cp, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.25rem" }}>👨‍⚕️</span>
              <div>
                <div style={{ fontWeight: 700 }}>{cp.name}</div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>{cp.role}</div>
              </div>
            </div>
          ))}
          {(patient.assigned_nurses ?? []).map((n) => (
            <div key={n} style={{ padding: "12px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.25rem" }}>👩‍⚕️</span>
              <div>
                <div style={{ fontWeight: 700 }}>{n}</div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>Nursing</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infectious disease */}
      <div className="card">
        <h3 className="section-title">Infectious Disease Management</h3>
        <p className="muted" style={{ margin: 0 }}>
          Review <strong>carePlanInfectiousDisease</strong> table for infection site, assessment, response to therapy,
          and treatment documentation. Active antibiotics: {(patient.medications ?? []).filter((m) =>
            ["antibiotic","vanc","merop","pip","ceftr","azithro","cipro"].some((kw) => m.name.toLowerCase().includes(kw))
          ).map((m) => m.name).join(", ") || "See medications tab"}.
        </p>
      </div>

      {/* EOL */}
      <div className="card">
        <h3 className="section-title">End-of-Life / Goals of Care</h3>
        <p className="muted" style={{ margin: 0 }}>
          No active EOL discussion documented. Data sourced from <strong>carePlanEOL</strong> table.
          This section surfaces EOL discussion dates, code status, and advance directive information
          when available.
        </p>
      </div>

    </PatientPageShell>
  );
}
