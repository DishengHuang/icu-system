"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ClinicalNote, PatientDetail } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type Props = {
  patientId: string;
  initial: ClinicalNote[];
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

function previewText(s: string, max = 120) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function ClinicianNotesManagement({ patientId, initial, onRefreshed }: Props) {
  const [rows, setRows] = useState<ClinicalNote[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("Clinician Note");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const title = useMemo(
    () => (editingId == null ? "Add note" : "Edit note"),
    [editingId]
  );

  function applyDetail(detail: PatientDetail) {
    const next = (detail.notes ?? []).filter((n) => n._source === "clinical");
    setRows(next);
    onRefreshed?.(detail);
  }

  function openAdd() {
    setError(null);
    setEditingId(null);
    setContent("");
    setNoteType("Clinician Note");
    setAuthor("");
    setEditorOpen(true);
  }

  function openEdit(n: ClinicalNote) {
    setError(null);
    setEditingId(n.id);
    setContent(n.content);
    setNoteType(n.note_type || "Clinician Note");
    setAuthor(n.author === "Clinician" ? "" : n.author);
    setEditorOpen(true);
  }

  function onSave() {
    const c = content.trim();
    if (!c) {
      setError("Note text is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (editingId == null) {
          const res = await fetch(
            `${API_BASE_URL}/patients/${patientId}/notes/clinical`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: c,
                note_type: noteType.trim() || "Clinician Note",
                author: author.trim() || null,
              }),
            }
          );
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to add note");
          }
          applyDetail((await res.json()) as PatientDetail);
        } else {
          const res = await fetch(
            `${API_BASE_URL}/patients/${patientId}/notes/clinical/${editingId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: c,
                note_type: noteType.trim() || "Clinician Note",
                author: author.trim() || null,
              }),
            }
          );
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to update note");
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
          marginBottom: 8,
        }}
      >
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Clinician Note
        </h3>
        <button className="button" onClick={openAdd} disabled={isPending} type="button">
          Add note
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {rows.length > 0 ? (
        <div className="dashboard-table-wrap table-compact-cells">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Preview</th>
                <th>Type</th>
                <th>Author</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((n, i) => (
                <tr key={n.id}>
                  <td className="muted">{i + 1}</td>
                  <td style={{ maxWidth: 280 }}>
                    <span style={{ whiteSpace: "pre-wrap" as const }}>
                      {previewText(n.content, 200)}
                    </span>
                  </td>
                  <td className="muted">{n.note_type}</td>
                  <td className="muted">{n.author}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => openEdit(n)}
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
        <p className="muted">No Clinician Note entries added yet.</p>
      )}

      <Modal
        title={title}
        open={editorOpen}
        onClose={() => (isPending ? null : setEditorOpen(false))}
      >
        <div className="modal-body">
          <label className="form-label">
            Note
            <textarea
              className="input"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Free-text clinical note…"
            />
          </label>

          <label className="form-label">
            Note type
            <input
              className="input"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              placeholder="e.g. Progress Note, Handoff, Consult"
            />
          </label>

          <label className="form-label">
            Author (optional)
            <input
              className="input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
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
