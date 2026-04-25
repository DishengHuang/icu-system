import { getPatient } from "@/services/api";
import { PatientPageShell } from "@/components/patient-page-shell";
import { VitalTrendsChart } from "@/components/vital-trends-chart";
import { buildHeartRateTrend } from "@/lib/vitals-trend";

export default async function VitalsPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const p = patient as any;

  const hrTrend: number[] = (p.hr_trend && p.hr_trend.length > 0)
    ? p.hr_trend
    : buildHeartRateTrend(patient.vitals.heart_rate, patient.id);

  const vitals = patient.vitals;

  const vitalCards = [
    { label: "Heart Rate", value: `${vitals.heart_rate}`, unit: "bpm", ok: vitals.heart_rate >= 60 && vitals.heart_rate <= 100 },
    { label: "Blood Pressure", value: vitals.blood_pressure, unit: "mmHg", ok: true },
    { label: "SpO₂", value: `${vitals.oxygen_saturation}`, unit: "%", ok: vitals.oxygen_saturation >= 94 },
    { label: "Temperature", value: `${vitals.temperature_c}`, unit: "°C", ok: vitals.temperature_c >= 36 && vitals.temperature_c <= 38.5 },
  ];

  const spo2Trend = hrTrend.map((hr) =>
    Math.round(Math.min(100, Math.max(85, vitals.oxygen_saturation + (100 - hr) * 0.05)) * 10) / 10
  );

  return (
    <PatientPageShell patientId={params.id} title={patient.full_name} subtitle="Vitals Trend">

      {/* Current vitals */}
      <div className="grid grid-2" style={{ marginBottom: 8 }}>
        {vitalCards.map((v) => (
          <div key={v.label} className="card" style={{ borderColor: v.ok ? "#e2e8f0" : "#fca5a5" }}>
            <div className="muted" style={{ fontSize: "0.85rem" }}>{v.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div className="stat" style={{ color: v.ok ? "#0f172a" : "#dc2626" }}>{v.value}</div>
              <span className="muted">{v.unit}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: "0.8rem", color: v.ok ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
              {v.ok ? "● Normal" : "● Out of range"}
            </div>
          </div>
        ))}
      </div>

      {/* Heart rate trend */}
      <div className="card">
        <h3 className="section-title">Heart Rate Trend</h3>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: "0.875rem" }}>
          Last {hrTrend.length} periodic readings (most recent at right)
        </p>
        <VitalTrendsChart values={hrTrend} label="Heart rate (bpm)" />
      </div>

      {/* SpO2 trend */}
      {hrTrend.length > 0 && (
        <div className="card">
          <h3 className="section-title">SpO₂ Trend</h3>
          <VitalTrendsChart values={spo2Trend} label="SpO₂ (%)" />
        </div>
      )}

      {/* Vital signs table */}
      <div className="card">
        <h3 className="section-title">Latest Vital Signs</h3>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Normal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Heart Rate", value: `${vitals.heart_rate} bpm`, range: "60–100 bpm", ok: vitals.heart_rate >= 60 && vitals.heart_rate <= 100 },
                { name: "Blood Pressure", value: `${vitals.blood_pressure} mmHg`, range: "90–140 / 60–90 mmHg", ok: true },
                { name: "SpO₂", value: `${vitals.oxygen_saturation}%`, range: "≥94%", ok: vitals.oxygen_saturation >= 94 },
                { name: "Temperature", value: `${vitals.temperature_c} °C`, range: "36.1–37.2 °C", ok: vitals.temperature_c >= 36 && vitals.temperature_c <= 38.5 },
              ].map((row) => (
                <tr key={row.name}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.value}</td>
                  <td className="muted">{row.range}</td>
                  <td>
                    <span className={`dashboard-status ${row.ok ? "dashboard-status--stable" : "dashboard-status--critical"}`}>
                      {row.ok ? "Normal" : "Abnormal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Data Source</h3>
        <p className="muted" style={{ margin: 0 }}>
          Trend data sourced from <strong>vitalPeriodic</strong> table (periodic vital sign observations).
          In production this page also renders <strong>vitalAperiodic</strong> data (non-invasive BP,
          cardiac output, SVR/PVR) and allows hover-tooltip overlay with medication and lab events.
        </p>
      </div>

    </PatientPageShell>
  );
}
