import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";

function BalanceBar({ intake, output }: { intake: number; output: number }) {
  const max = Math.max(intake, output, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        { label: "Intake", value: intake, color: "#3b82f6" },
        { label: "Output", value: output, color: "#f97316" },
      ].map((item) => (
        <div key={item.label} style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#475569" }}>{item.label}</span>
          <div style={{ background: "#e2e8f0", height: 14, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${(item.value / max) * 100}%`, height: "100%", background: item.color, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "right" }}>{item.value.toLocaleString()} mL</span>
        </div>
      ))}
    </div>
  );
}

export default async function IntakeOutputPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const ios = patient.intake_output ?? [];
  const total = ios[0] ?? { intake_ml: 0, output_ml: 0, net_ml: 0, shift: "24h" };

  const net = total.net_ml;
  const netColor = net > 1000 ? "#dc2626" : net > 500 ? "#d97706" : net < -500 ? "#92400e" : "#16a34a";

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Intake / Output & Fluid Balance">

      {/* Net balance summary */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Intake", value: `${total.intake_ml.toLocaleString()} mL`, color: "#3b82f6" },
          { label: "Total Output", value: `${total.output_ml.toLocaleString()} mL`, color: "#f97316" },
          { label: "Net Balance", value: `${net > 0 ? "+" : ""}${net.toLocaleString()} mL`, color: netColor },
        ].map((card) => (
          <div key={card.label} className="card" style={{ textAlign: "center" }}>
            <div className="muted" style={{ fontSize: "0.875rem", marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Visual bar */}
      <div className="card">
        <h3 className="section-title">Fluid Balance Visualization</h3>
        <BalanceBar intake={total.intake_ml} output={total.output_ml} />
        <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 8, background: net > 500 ? "#fff7f7" : net < -500 ? "#fefce8" : "#f0fdf4", border: `1px solid ${net > 500 ? "#fecaca" : net < -500 ? "#fde68a" : "#bbf7d0"}` }}>
          <strong style={{ color: netColor }}>
            {net > 1000 ? "⚠ Significant positive fluid balance — monitor for fluid overload" :
             net > 500 ? "Mild positive balance — continue monitoring" :
             net < -500 ? "Negative balance — monitor for hypovolemia" :
             "✓ Fluid balance within acceptable range"}
          </strong>
        </div>
      </div>

      {/* By-shift breakdown */}
      <div className="card">
        <h3 className="section-title">By Shift</h3>
        {ios.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr><th>Period</th><th>Intake (mL)</th><th>Output (mL)</th><th>Net (mL)</th></tr>
              </thead>
              <tbody>
                {ios.map((io, i) => (
                  <tr key={i}>
                    <td><strong>{io.shift}</strong></td>
                    <td style={{ color: "#3b82f6", fontWeight: 600 }}>+{io.intake_ml.toLocaleString()}</td>
                    <td style={{ color: "#f97316", fontWeight: 600 }}>-{io.output_ml.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: io.net_ml > 0 ? "#dc2626" : "#16a34a" }}>
                      {io.net_ml > 0 ? "+" : ""}{io.net_ml.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No intake/output data available.</p>
        )}
      </div>

      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          Data from <strong>intakeOutput</strong> table. In production this page also shows dialysis totals,
          urine output trend, IV fluid types, and cumulative net balance chart over the full ICU stay.
        </p>
      </div>

    </PatientPageShell>
  );
}
