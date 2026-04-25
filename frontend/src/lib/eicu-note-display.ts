import type { ClinicalNote } from "@/types";

/** eICU `notetype` text that may contain a redundant "Clinician" role token, or a generic "Clinician" author. */
function isListedEicuNotefamily(raw: string): boolean {
  const t = raw.trim();
  return (
    /Procedure\s+Note/i.test(t) ||
    /Admission\s+Note/i.test(t) ||
    /Nursing\s+Note/i.test(t) ||
    /\bConsult(\s+Note)?\b/i.test(t) ||
    /Comprehensive\s+Progress(\s+Note)?/i.test(t)
  );
}

/**
 * Strips a standalone "Clinician" token from eICU note type labels in these families
 * (e.g. "Nursing Note (Clinician)").
 */
export function formatEicuNoteTypeForDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (!/\bClinician\b/i.test(t) || !isListedEicuNotefamily(t)) {
    return t;
  }
  const cleaned = t
    .replace(/\bClinician\b/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[\-–—]\s*$/g, "")
    .replace(/^\s*[\-–—]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || t;
}

/**
 * eICU detail API uses author "Clinician" for all `note` rows; omit that label for these
 * same note families so the card is not "Clinician" + e.g. Nursing Note.
 */
export function formatEicuNoteAuthorForDisplay(author: string, rawNoteType: string): string {
  if (author !== "Clinician" || !isListedEicuNotefamily(rawNoteType)) {
    return author;
  }
  return "";
}

export function patientEicuStyleNoteType(note: ClinicalNote): string {
  if (note._source === "clinical") {
    return note.note_type;
  }
  return formatEicuNoteTypeForDisplay(note.note_type);
}

export function patientEicuStyleNoteAuthor(note: ClinicalNote): string {
  if (note._source === "clinical") {
    return note.author;
  }
  return formatEicuNoteAuthorForDisplay(note.author, note.note_type);
}
