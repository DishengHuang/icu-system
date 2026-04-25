import Link from "next/link";

import { PatientSummary } from "@/types";

export function PatientSummaryCard({ patient }: { patient: PatientSummary }) {
  return (
    <Link className="patient-row" href={`/patients/${patient.id}`}>
      <div>
        <strong>{patient.full_name}</strong>
        <div className="muted">
          {patient.mrn} | {patient.room}
        </div>
      </div>
      <div>{patient.primary_diagnosis}</div>
    </Link>
  );
}
