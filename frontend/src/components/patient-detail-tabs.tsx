"use client";

import { useState } from "react";

import { AgentChatPanel } from "@/components/agent-chat-panel";
import { VitalTrendsChart } from "@/components/vital-trends-chart";
import { patientEicuStyleNoteType } from "@/lib/eicu-note-display";
import type { PatientDetail } from "@/types";

type PatientDetailTabsProps = {
  patient: PatientDetail;
  hrTrend: number[];
};

type TabId = "overview" | "medications" | "labs" | "notes";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "medications", label: "Medications" },
  { id: "labs", label: "Labs" },
  { id: "notes", label: "Notes" },
];

function formatNetMl(value: number): string {
  return `${value > 0 ? "+" : ""}${value} mL`;
}

function EmptyState({ label }: { label: string }) {
  return <p className="patient-detail-empty muted">No {label} available.</p>;
}

export function PatientDetailTabs({
  patient,
  hrTrend,
}: PatientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const infusions = patient.infusions ?? [];
  const intakeOutput = patient.intake_output ?? [];
  const respiratory = patient.respiratory ?? [];
  const labs = patient.labs ?? [];

  return (
    <div className="patient-detail-layout">
      <div className="patient-detail-main">
        <div className="patient-detail-shell">
          <section className="patient-summary-hero card">
            <div className="patient-summary-hero-main">
              <div className="patient-summary-name-row">
                <h1 className="patient-summary-name">{patient.full_name}</h1>
              </div>
            </div>

            <div className="patient-summary-meta">
              <span className="patient-summary-meta-item">ICU Unit: {patient.room}</span>
              <span className="patient-summary-meta-item">
                {patient.primary_diagnosis}
              </span>
              <span
                className={
                  patient.clinical_status === "Critical"
                    ? "patient-summary-status patient-summary-status--critical"
                    : "patient-summary-status patient-summary-status--stable"
                }
              >
                {patient.clinical_status}
              </span>
            </div>
          </section>

          <div className="patient-detail-tabs" role="tablist" aria-label="Patient detail">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id
                    ? "patient-detail-tab patient-detail-tab--active"
                    : "patient-detail-tab"
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="patient-detail-panel">
            {activeTab === "overview" ? (
              <div className="grid patient-overview-content">
                <div className="patient-overview-top-grid">
                  <div className="patient-overview-left-column">
                    <div className="card">
                      <h3 className="section-title">Overview</h3>
                      <dl className="patient-detail-dl">
                        <div className="patient-detail-dl-row">
                          <dt>ID</dt>
                          <dd>{patient.display_id}</dd>
                        </div>
                        <div className="patient-detail-dl-row">
                          <dt>Age</dt>
                          <dd>{patient.age}</dd>
                        </div>
                        <div className="patient-detail-dl-row">
                          <dt>Gender</dt>
                          <dd>{patient.gender}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="grid grid-2">
                      <div className="card">
                        <div className="muted">Heart rate</div>
                        <div className="stat">{patient.vitals.heart_rate} bpm</div>
                      </div>
                      <div className="card">
                        <div className="muted">Blood pressure</div>
                        <div className="stat">{patient.vitals.blood_pressure}</div>
                      </div>
                      <div className="card">
                        <div className="muted">SpO2</div>
                        <div className="stat">{patient.vitals.oxygen_saturation}%</div>
                      </div>
                      <div className="card">
                        <div className="muted">Temperature</div>
                        <div className="stat">{patient.vitals.temperature_c} °C</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Vital trends</h3>
                    <VitalTrendsChart values={hrTrend} />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="card">
                    <h3 className="section-title">Care plan</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {patient.care_plan}
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Allergies</h3>
                    <ul>
                      {patient.allergies.map((allergy) => (
                        <li key={allergy}>{allergy}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Care providers</h3>
                    <ul>
                      {patient.care_providers.map((provider) => (
                        <li key={`${provider.role}-${provider.name}`}>
                          {provider.role}: {provider.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Assigned nurses</h3>
                    <ul>
                      {patient.assigned_nurses.map((nurse) => (
                        <li key={nurse}>{nurse}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Treatments</h3>
                    <ul>
                      {patient.treatments.map((treatment) => (
                        <li key={treatment}>{treatment}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="card">
                    <h3 className="section-title">Respiratory</h3>
                    {respiratory.length === 0 ? (
                      <EmptyState label="respiratory support" />
                    ) : (
                      <ul>
                        {respiratory.map((item) => (
                          <li key={item.id}>
                            {item.device} - {item.mode} - {item.details}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="section-title">Intake / Output</h3>
                    {intakeOutput.length === 0 ? (
                      <EmptyState label="intake/output data" />
                    ) : (
                      <ul>
                        {intakeOutput.map((item) => (
                          <li key={item.id}>
                            {item.shift}: Intake {item.intake_ml} mL, Output{" "}
                            {item.output_ml} mL, Net {formatNetMl(item.net_ml)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "medications" ? (
              <div className="grid grid-2">
                <div className="card">
                  <h3 className="section-title">Medications</h3>
                  <ul>
                    {patient.medications.map((medication) => (
                      <li key={medication.id}>
                        {medication.name} - {medication.dosage} -{" "}
                        {medication.schedule}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card">
                  <h3 className="section-title">Past medical history</h3>
                  <ul>
                    {patient.past_medical_history.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="card">
                  <h3 className="section-title">Infusions</h3>
                  {infusions.length === 0 ? (
                    <EmptyState label="infusions" />
                  ) : (
                    <ul>
                      {infusions.map((infusion) => (
                        <li key={infusion.id}>
                          {infusion.name} - {infusion.rate} ({infusion.status})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "labs" ? (
              <div className="card">
                <h3 className="section-title">Labs</h3>
                {labs.length === 0 ? (
                  <EmptyState label="labs" />
                ) : (
                  <ul>
                    {labs.map((lab) => (
                      <li key={lab.id}>
                        {lab.name}: {lab.value} ({lab.status})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div className="card">
                <h3 className="section-title">Clinical notes</h3>
                {patient.notes.length === 0 ? (
                  <EmptyState label="notes" />
                ) : (
                  <ul>
                    {patient.notes.map((note) => (
                      <li key={note.id}>
                        <strong>{patientEicuStyleNoteType(note)}:</strong> {note.content}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
      <aside className="agent-chat-sidebar">
        <AgentChatPanel patient={patient} />
      </aside>
    </div>
  );
}
