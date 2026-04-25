"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { InfusionRecord, MedicationRecord, PatientDetail } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type TherapyKind = "medication" | "infusion";

type MedRow = {
  id: number;
  name: string;
  dosage: string;
  schedule: string;
  status: string;
};

type InfRow = {
  id: number;
  name: string;
  rate: string;
  status: string;
};

type ConfirmTarget = { kind: TherapyKind; id: number };

type Props = {
  patientId: string;
  initialMedications: MedicationRecord[];
  initialInfusions: InfusionRecord[];
  allergies: string[];
};

function medRowsFrom(meds: MedicationRecord[] | undefined): MedRow[] {
  return (meds ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    schedule: m.schedule,
    status: m.status,
  }));
}

function infRowsFrom(infs: InfusionRecord[] | undefined): InfRow[] {
  return (infs ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    rate: i.rate,
    status: i.status,
  }));
}

async function addMedication(
  patientId: string,
  payload: { name: string; dosage?: string; schedule?: string }
): Promise<PatientDetail> {
  const res = await fetch(`${API_BASE_URL}/patients/${patientId}/medications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to add medication");
  }
  return (await res.json()) as PatientDetail;
}

async function addInfusion(
  patientId: string,
  payload: { name: string; rate?: string }
): Promise<PatientDetail> {
  const res = await fetch(`${API_BASE_URL}/patients/${patientId}/infusions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to add infusion");
  }
  return (await res.json()) as PatientDetail;
}

async function discontinueMedication(
  patientId: string,
  medicationId: number
): Promise<PatientDetail> {
  const res = await fetch(
    `${API_BASE_URL}/patients/${patientId}/medications/${medicationId}/discontinue`,
    { method: "POST" }
  );
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to discontinue medication");
  }
  return (await res.json()) as PatientDetail;
}

async function discontinueInfusion(
  patientId: string,
  infusionId: number
): Promise<PatientDetail> {
  const res = await fetch(
    `${API_BASE_URL}/patients/${patientId}/infusions/${infusionId}/discontinue`,
    { method: "POST" }
  );
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to discontinue infusion");
  }
  return (await res.json()) as PatientDetail;
}

function isMedDiscontinued(m: MedRow): boolean {
  return m.status === "Discontinued";
}

function isInfDiscontinued(i: InfRow): boolean {
  return i.status === "Discontinued";
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")
  );
  return Array.from(nodes).filter((el) => !el.hasAttribute("disabled"));
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusables = getFocusableElements(dialog);
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusableElements(dialog);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h4 className="modal-title">{title}</h4>
          <button className="button button--secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DrugManagement({
  patientId,
  initialMedications,
  initialInfusions,
  allergies,
}: Props) {
  const [medications, setMedications] = useState<MedRow[]>(() =>
    medRowsFrom(initialMedications)
  );
  const [infusions, setInfusions] = useState<InfRow[]>(() =>
    infRowsFrom(initialInfusions)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<TherapyKind>("medication");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [rate, setRate] = useState("");

  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  useEffect(() => {
    setMedications(medRowsFrom(initialMedications));
    setInfusions(infRowsFrom(initialInfusions));
  }, [patientId, initialMedications, initialInfusions]);

  const allNames = useMemo(() => {
    return [
      ...medications.map((m) => m.name),
      ...infusions.map((i) => i.name),
    ];
  }, [medications, infusions]);

  const conflictNames = useMemo(() => {
    const al = allergies.map((a) => a.toLowerCase());
    return allNames.filter((n) =>
      al.some(
        (a) =>
          n.toLowerCase().includes(a) || a.includes(n.toLowerCase().split(" ")[0] ?? "")
      )
    );
  }, [allergies, allNames]);

  const medDiscontinuedCount = useMemo(
    () => medications.filter((m) => isMedDiscontinued(m)).length,
    [medications]
  );
  const infDiscontinuedCount = useMemo(
    () => infusions.filter((i) => isInfDiscontinued(i)).length,
    [infusions]
  );
  const discontinuedCount = medDiscontinuedCount + infDiscontinuedCount;

  const visibleMedications = useMemo(() => {
    if (showDiscontinued) return medications;
    return medications.filter((m) => !isMedDiscontinued(m));
  }, [medications, showDiscontinued]);

  const visibleInfusions = useMemo(() => {
    if (showDiscontinued) return infusions;
    return infusions.filter((i) => !isInfDiscontinued(i));
  }, [infusions, showDiscontinued]);

  function applyPatient(detail: PatientDetail) {
    setMedications(medRowsFrom(detail.medications));
    setInfusions(infRowsFrom(detail.infusions));
  }

  function openAdd() {
    setError(null);
    setAddKind("medication");
    setName("");
    setDosage("");
    setSchedule("");
    setRate("");
    setAddOpen(true);
  }

  function onSaveAdd() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      try {
        if (addKind === "medication") {
          const updated = await addMedication(patientId, {
            name: trimmed,
            dosage: dosage.trim() || undefined,
            schedule: schedule.trim() || undefined,
          });
          applyPatient(updated);
        } else {
          const updated = await addInfusion(patientId, {
            name: trimmed,
            rate: rate.trim() || undefined,
          });
          applyPatient(updated);
        }
        setAddOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  function onConfirmDiscontinue() {
    if (!confirm) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated =
          confirm.kind === "medication"
            ? await discontinueMedication(patientId, confirm.id)
            : await discontinueInfusion(patientId, confirm.id);
        applyPatient(updated);
        setConfirm(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to discontinue.");
      }
    });
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Drug Management
        </h3>
        <button className="button" onClick={openAdd} disabled={isPending}>
          Add
        </button>
      </div>

      {conflictNames.length > 0 && (
        <div className="alert-box">
          <div>
            <strong style={{ color: "#b91c1c" }}>Potential allergy conflict:</strong>{" "}
            <span className="muted">
              {conflictNames.join(", ")} (allergies: {allergies.join(", ")})
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {discontinuedCount > 0 && (
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#334155",
            }}
          >
            <input
              type="checkbox"
              checked={showDiscontinued}
              onChange={(e) => setShowDiscontinued(e.target.checked)}
            />
            Show discontinued ({discontinuedCount})
          </label>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h4 className="section-title" style={{ marginBottom: 10 }}>
          Medications ({visibleMedications.length}
          {!showDiscontinued && medDiscontinuedCount
            ? ` active, ${medDiscontinuedCount} discontinued hidden`
            : ""}
          )
        </h4>
        {visibleMedications.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Drug name</th>
                  <th>Dosage</th>
                  <th>Schedule / route</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleMedications.map((m) => (
                  <tr
                    key={m.id}
                    className={isMedDiscontinued(m) ? "table-row--muted" : undefined}
                  >
                    <td>
                      <strong>{m.name}</strong>
                    </td>
                    <td>{m.dosage}</td>
                    <td className="muted">{m.schedule}</td>
                    <td>
                      <span
                        className={`dashboard-status ${
                          !isMedDiscontinued(m) ? "dashboard-status--stable" : ""
                        }`}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!isMedDiscontinued(m) ? (
                        <button
                          className="button button--secondary"
                          onClick={() => setConfirm({ kind: "medication", id: m.id })}
                          disabled={isPending}
                        >
                          Discontinue
                        </button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            {showDiscontinued
              ? "No medications on file."
              : "No active medications."}
          </p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h4 className="section-title" style={{ marginBottom: 10 }}>
          Infusions ({visibleInfusions.length}
          {!showDiscontinued && infDiscontinuedCount
            ? ` active, ${infDiscontinuedCount} discontinued hidden`
            : ""}
          )
        </h4>
        {visibleInfusions.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleInfusions.map((inf) => (
                  <tr
                    key={inf.id}
                    className={isInfDiscontinued(inf) ? "table-row--muted" : undefined}
                  >
                    <td>
                      <strong>{inf.name}</strong>
                    </td>
                    <td>{inf.rate}</td>
                    <td>
                      <span
                        className={`dashboard-status ${
                          !isInfDiscontinued(inf) ? "dashboard-status--stable" : ""
                        }`}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {inf.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!isInfDiscontinued(inf) ? (
                        <button
                          className="button button--secondary"
                          onClick={() => setConfirm({ kind: "infusion", id: inf.id })}
                          disabled={isPending}
                        >
                          Discontinue
                        </button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            {showDiscontinued
              ? "No infusions on file."
              : "No active infusions."}
          </p>
        )}
      </div>

      <Modal
        title="Add order"
        open={addOpen}
        onClose={() => (isPending ? null : setAddOpen(false))}
      >
        <div className="modal-body">
          <label className="form-label">
            Type
            <select
              className="input"
              value={addKind}
              onChange={(e) => setAddKind(e.target.value as TherapyKind)}
            >
              <option value="medication">Medication</option>
              <option value="infusion">Infusion</option>
            </select>
          </label>

          <label className="form-label">
            {addKind === "medication" ? "Medication name" : "Infusion / additive"}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                addKind === "medication" ? "e.g. Vancomycin" : "e.g. Norepinephrine"
              }
              className="input"
            />
          </label>

          {addKind === "medication" ? (
            <div className="form-grid">
              <label className="form-label">
                Dosage
                <input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 g IV"
                  className="input"
                />
              </label>
              <label className="form-label">
                Schedule / route
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. q8h"
                  className="input"
                />
              </label>
            </div>
          ) : (
            <label className="form-label">
              Rate
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 0.1 mcg/kg/min"
                className="input"
              />
            </label>
          )}
        </div>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={() => setAddOpen(false)}
            disabled={isPending}
          >
            Cancel
          </button>
          <button className="button" onClick={onSaveAdd} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      <Modal
        title="Discontinue"
        open={confirm != null}
        onClose={() => (isPending ? null : setConfirm(null))}
      >
        <div className="modal-body">
          <p style={{ margin: 0 }}>
            {confirm
              ? `Are you sure you want to discontinue this ${
                  confirm.kind === "medication" ? "medication" : "infusion"
                }?`
              : null}
          </p>
        </div>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={() => setConfirm(null)}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            className="button button--danger"
            onClick={onConfirmDiscontinue}
            disabled={isPending}
          >
            {isPending ? "Discontinuing…" : "Discontinue"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
