"""
Agent service – Anthropic Claude streaming clinical assistant.
Injects full patient context from all major eICU tables into the prompt.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncGenerator, Iterator
from typing import Any

try:
    import anthropic  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    anthropic = None  # type: ignore

_client = None


def _get_client():
    global _client
    if anthropic is None:
        raise RuntimeError(
            "Anthropic SDK not installed. Run `pip install anthropic` in backend/.venv "
            "or remove agent usage."
        )
    if _client is None:
        import os
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            # Try reading from .env manually
            try:
                with open(".env") as f:
                    for line in f:
                        if line.startswith("ANTHROPIC_API_KEY="):
                            api_key = line.strip().split("=", 1)[1]
                            break
            except FileNotFoundError:
                pass
        if not api_key:
            raise RuntimeError(
                "Anthropic is not configured. Add ANTHROPIC_API_KEY to backend/.env."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_system_prompt(patient: dict) -> str:
    medications = ", ".join(
        f"{m['name']} ({m.get('dosage','—')}, {m.get('schedule','—')})"
        for m in (patient.get("medications") or [])[:8]
    ) or "None listed"

    infusions = ", ".join(
        f"{i['name']} @ {i.get('rate','—')} [{i.get('status','—')}]"
        for i in (patient.get("infusions") or [])[:6]
    ) or "None listed"

    diagnoses = ", ".join(
        f"{d['diagnosis']} ({d.get('status','—')})"
        for d in (patient.get("diagnoses") or [])[:6]
    ) or "None listed"

    allergies = ", ".join((patient.get("allergies") or [])[:10]) or "None listed"

    all_labs = patient.get("labs") or []
    abnormal = [l for l in all_labs if l.get("status") != "Normal"]
    normal   = [l for l in all_labs if l.get("status") == "Normal"]
    labs_str = ", ".join(
        f"{l['name']} {l.get('value','—')} [{l.get('status','—')}]"
        for l in (abnormal + normal)[:12]
    ) or "None listed"

    io_list = patient.get("intake_output") or []
    if io_list:
        io  = io_list[0]
        net = io.get("net_ml", 0)
        io_str = (
            f"Intake {io.get('intake_ml',0):,} mL, "
            f"Output {io.get('output_ml',0):,} mL, "
            f"Net {'+' if net >= 0 else ''}{net:,} mL"
        )
    else:
        io_str = "Not available"

    resp_str = "; ".join(
        f"{r.get('device','—')} / {r.get('mode','—')}"
        for r in (patient.get("respiratory") or [])[:3]
    ) or "No respiratory support documented"

    apache = patient.get("apache") or {}
    mort   = apache.get("predicted_icu_mortality")
    apache_str = (
        f"Score {apache.get('score','—')}, "
        f"Predicted ICU mortality {f'{mort*100:.1f}%' if mort is not None else '—'}"
    )

    vitals = patient.get("vitals") or {}
    pmh        = ", ".join((patient.get("past_medical_history") or [])[:8]) or "None listed"
    treatments = ", ".join((patient.get("treatments") or [])[:8]) or "None listed"
    notes      = patient.get("notes") or []
    latest_note = notes[-1]["content"] if notes else "No note available"

    return f"""You are a concise ICU clinical assistant inside a hospital information system.
Use ONLY the patient data provided below. If information is missing, say so clearly.
Do not invent lab values, medications, or clinical findings.
Keep answers short, practical, and clinically relevant. Highlight urgent concerns first.

=== PATIENT CHART ===
Name: {patient.get('full_name','—')}   MRN: {patient.get('mrn','—')}
Room: {patient.get('room','—')}   Age/Gender: {patient.get('age','—')} / {patient.get('gender','—')}
Clinical status: {patient.get('clinical_status','—')}
Primary diagnosis: {patient.get('primary_diagnosis','—')}

VITALS: HR {vitals.get('heart_rate','—')} bpm | BP {vitals.get('blood_pressure','—')} | SpO₂ {vitals.get('oxygen_saturation','—')}% | Temp {vitals.get('temperature_c','—')} °C
SEVERITY (APACHE): {apache_str}
DIAGNOSES: {diagnoses}
MEDICATIONS: {medications}
INFUSIONS: {infusions}
LABS (abnormal first): {labs_str}
FLUID BALANCE: {io_str}
RESPIRATORY: {resp_str}
ALLERGIES: {allergies}
TREATMENTS: {treatments}
PAST MEDICAL HISTORY: {pmh}
LATEST NOTE: {latest_note}"""


def _build_messages(message: str, history: list[dict]) -> list[dict]:
    messages = []
    for h in history:
        role = h.get("role", "user")
        text = h.get("text", "").strip()
        if text:
            messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": message})
    return messages


# ---------------------------------------------------------------------------
# Async SSE generator for FastAPI StreamingResponse
# ---------------------------------------------------------------------------

async def stream_agent_response(
    patient: dict,
    message: str,
    history: list[dict] | None = None,
    context: dict | None = None,
) -> AsyncGenerator[str, None]:

    def _sync_stream() -> list[str]:
        client = _get_client()
        chunks = []
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=_build_system_prompt(patient),
            messages=_build_messages(message, history or []),
        ) as stream:
            for text in stream.text_stream:
                chunks.append(text)
        return chunks

    try:
        loop = asyncio.get_event_loop()
        chunks = await loop.run_in_executor(None, _sync_stream)

        if not chunks:
            yield f"data: {json.dumps({'type': 'error', 'text': 'Empty response from Claude.'})}\n\n"
            return

        for text in chunks:
            yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except RuntimeError as exc:
        yield f"data: {json.dumps({'type': 'error', 'text': str(exc)})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'type': 'error', 'text': f'Agent error: {exc}'})}\n\n"
