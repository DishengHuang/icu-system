import Link from "next/link";
import { ReactNode } from "react";

const tabs = [
  { slug: "summary", label: "Summary" },
  { slug: "vitals", label: "Vitals" },
  { slug: "labs", label: "Labs" },
  { slug: "medications", label: "Medications" },
  { slug: "intake-output", label: "I/O" },
  { slug: "respiratory", label: "Respiratory" },
  { slug: "diagnosis", label: "Diagnosis" },
  { slug: "notes", label: "Notes" },
  { slug: "nursing", label: "Nursing" },
  { slug: "care-plan", label: "Care Plan" },
  { slug: "risk-alerts", label: "Risk & Alerts" },
];

export function PatientPageShell({ patientId, title, subtitle, children }: { patientId: string; title: string; subtitle?: string; children: ReactNode; }) {
  return (
    <div className="patient-route-shell">
      <div className="patient-route-toolbar card">
        <div>
          <div className="muted">Patient workspace</div>
          <h1 className="section-title" style={{ marginBottom: 0 }}>{title}</h1>
          {subtitle ? <p className="muted" style={{ marginTop: 8 }}>{subtitle}</p> : null}
        </div>
        <Link href="/patients" className="secondary-btn">Back to Patient List</Link>
      </div>
      <div className="patient-tabbar">
        {tabs.map((tab) => (
          <Link key={tab.slug} href={`/patients/${patientId}/${tab.slug}`} className="patient-tab-link">{tab.label}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
