"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DiagnosisRecord, PatientDetail } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const STATUS_OPTIONS = ["Active", "Confirmed", "Resolved"] as const;

type Props = {
  patientId: string;
  initial: DiagnosisRecord[];
  onRefreshed?: (detail: PatientDetail) => void;
};

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

export function DiagnosisManagement({ patientId, initial, onRefreshed }: Props) {
  const [rows, setRows] = useState<DiagnosisRecord[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("Active");
  const [clinician, setClinician] = useState("");

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const title = useMemo(
    () => (editingId == null ? "Add clinical diagnosis" : "Edit clinical diagnosis"),
    [editingId]
  );

  function applyDetail(detail: PatientDetail) {
    const next = (detail.diagnoses ?? []).filter((d) => d._source === "clinical");
    setRows(next);
    onRefreshed?.(detail);
  }

  function openAdd() {
    setError(null);
    setEditingId(null);
    setText("");
    setStatus("Active");
    setClinician("");
    setEditorOpen(true);
  }

  function openEdit(d: DiagnosisRecord) {
    setError(null);
    setEditingId(d.id);
    setText(d.diagnosis);
    setStatus(
      (STATUS_OPTIONS as readonly string[]).includes(d.status) ? (d.status as (typeof STATUS_OPTIONS)[number]) : "Active"
    );
    setClinician(d.clinician === "—" ? "" : d.clinician);
    setEditorOpen(true);
  }

  function onSave() {
    const t = text.trim();
    if (!t) {
      setError("Diagnosis text is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (editingId == null) {
          const res = await fetch(
            `${API_BASE_URL}/patients/${patientId}/diagnoses/clinical`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                diagnosis: t,
                status,
                clinician: clinician.trim() || null,
              }),
            }
          );
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to add diagnosis");
          }
          applyDetail((await res.json()) as PatientDetail);
        } else {
          const res = await fetch(
            `${API_BASE_URL}/patients/${patientId}/diagnoses/clinical/${editingId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                diagnosis: t,
                status,
                clinician: clinician.trim() || null,
              }),
            }
          );
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to update diagnosis");
          }
          applyDetail((await res.json()) as PatientDetail);
        }
        setEditorOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed.");
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
          Clinical problem list
        </h3>
        <button className="button" onClick={openAdd} disabled={isPending} type="button">
          Add diagnosis
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {rows.length > 0 ? (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Clinician</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={d.id}>
                  <td className="muted">{i + 1}</td>
                  <td>
                    <strong>{d.diagnosis}</strong>
                  </td>
                  <td>
                    <span
                      className={`dashboard-status ${
                        d.status === "Resolved" ? "dashboard-status--stable" : "dashboard-status--critical"
                      }`}
                      style={{ fontSize: "0.78rem" }}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="muted">{d.clinician}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => openEdit(d)}
                      disabled={isPending}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No clinical diagnoses added yet.</p>
      )}

      <Modal
        title={title}
        open={editorOpen}
        onClose={() => (isPending ? null : setEditorOpen(false))}
      >
        <div className="modal-body">
          <label className="form-label">
            Diagnosis
            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Sepsis due to pneumonia"
            />
          </label>

          <label className="form-label">
            Status
            <select
              className="input"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])
              }
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Clinician (optional)
            <input
              className="input"
              value={clinician}
              onChange={(e) => setClinician(e.target.value)}
              placeholder="e.g. Dr. Chen"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setEditorOpen(false)}
            disabled={isPending}
          >
            Cancel
          </button>
          <button className="button" type="button" onClick={onSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
