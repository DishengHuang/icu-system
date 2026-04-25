import { VitalSigns } from "@/types";

export function VitalsPanel({ vitals }: { vitals: VitalSigns }) {
  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="muted">Heart Rate</div>
        <div className="stat">{vitals.heart_rate} bpm</div>
      </div>
      <div className="card">
        <div className="muted">Blood Pressure</div>
        <div className="stat">{vitals.blood_pressure}</div>
      </div>
      <div className="card">
        <div className="muted">Oxygen Saturation</div>
        <div className="stat">{vitals.oxygen_saturation}%</div>
      </div>
      <div className="card">
        <div className="muted">Temperature</div>
        <div className="stat">{vitals.temperature_c} C</div>
      </div>
    </div>
  );
}
