from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.patient_service import (
    add_clinical_diagnosis,
    add_clinical_note,
    add_infusion_override,
    add_medication_override,
    get_patients,
    get_patient_detail,
    stop_infusion,
    stop_medication,
    update_clinical_diagnosis,
    update_clinical_note,
)
from app.services.agent_service import stream_agent_response

router = APIRouter()


# ---------------------------------------------------------------------------
# DB dependency
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Auth (simple mock – replace with real JWT in production)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


MOCK_USERS = {
    "doctor@example.com": {
        "password": "doctor123",
        "doctor_name": "Dr. Alex Rivera",
        "access_token": "mock-token-doctor",
    },
    "nurse@example.com": {
        "password": "nurse123",
        "doctor_name": "Nurse Jordan Lee",
        "access_token": "mock-token-nurse",
    },
}


@router.post("/auth/login")
def login(body: LoginRequest):
    user = MOCK_USERS.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": user["access_token"],
        "doctor_name": user["doctor_name"],
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

@router.get("/patients")
def list_patients(q: Optional[str] = None, db: Session = Depends(get_db)):
    return get_patients(db, q)


@router.get("/patients/{patient_id}")
def patient_detail(patient_id: int, db: Session = Depends(get_db)):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# ---------------------------------------------------------------------------
# Drug management (overlay on top of eICU medication / infusion tables)
# ---------------------------------------------------------------------------


class AddMedicationRequest(BaseModel):
    name: str
    dosage: str | None = None
    schedule: str | None = None


class AddInfusionRequest(BaseModel):
    name: str
    rate: str | None = None


@router.post("/patients/{patient_id}/medications")
def add_medication(patient_id: int, body: AddMedicationRequest, db: Session = Depends(get_db)):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Medication name is required")

    add_medication_override(
        db,
        patientunitstayid=patient_id,
        name=body.name.strip(),
        dosage=(body.dosage.strip() if body.dosage else None),
        schedule=(body.schedule.strip() if body.schedule else None),
    )
    # Return refreshed patient so frontend can update tables easily
    return get_patient_detail(db, patient_id)


def _discontinue_medication(patient_id: int, medication_id: int, db: Session) -> dict:
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    stop_medication(db, patientunitstayid=patient_id, medication_id=medication_id)
    return get_patient_detail(db, patient_id)


@router.post("/patients/{patient_id}/medications/{medication_id}/discontinue")
def discontinue_medication_route(patient_id: int, medication_id: int, db: Session = Depends(get_db)):
    return _discontinue_medication(patient_id, medication_id, db)


# Backward-compatible alias (older clients)
@router.post("/patients/{patient_id}/medications/{medication_id}/stop")
def stop_medication_route(patient_id: int, medication_id: int, db: Session = Depends(get_db)):
    return _discontinue_medication(patient_id, medication_id, db)


# ---------------------------------------------------------------------------
# Infusion management (overlay on top of eICU infusiondrug table)
# ---------------------------------------------------------------------------


@router.post("/patients/{patient_id}/infusions")
def add_infusion(patient_id: int, body: AddInfusionRequest, db: Session = Depends(get_db)):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Infusion name is required")

    add_infusion_override(
        db,
        patientunitstayid=patient_id,
        name=body.name.strip(),
        rate=(body.rate.strip() if body.rate else None),
    )
    return get_patient_detail(db, patient_id)


def _discontinue_infusion(patient_id: int, infusion_id: int, db: Session) -> dict:
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    stop_infusion(db, patientunitstayid=patient_id, infusion_id=infusion_id)
    return get_patient_detail(db, patient_id)


@router.post("/patients/{patient_id}/infusions/{infusion_id}/discontinue")
def discontinue_infusion_route(patient_id: int, infusion_id: int, db: Session = Depends(get_db)):
    return _discontinue_infusion(patient_id, infusion_id, db)


# Backward-compatible alias
@router.post("/patients/{patient_id}/infusions/{infusion_id}/stop")
def stop_infusion_route(patient_id: int, infusion_id: int, db: Session = Depends(get_db)):
    return _discontinue_infusion(patient_id, infusion_id, db)


# ---------------------------------------------------------------------------
# Clinical diagnosis (overlay; does not write to eICU `diagnosis` table)
# ---------------------------------------------------------------------------


class ClinicalDiagnosisRequest(BaseModel):
    diagnosis: str
    status: str
    clinician: str | None = None


@router.post("/patients/{patient_id}/diagnoses/clinical")
def create_clinical_diagnosis(
    patient_id: int, body: ClinicalDiagnosisRequest, db: Session = Depends(get_db)
):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.diagnosis.strip():
        raise HTTPException(status_code=400, detail="Diagnosis is required")
    try:
        add_clinical_diagnosis(
            db,
            patientunitstayid=patient_id,
            diagnosis=body.diagnosis,
            status=body.status,
            clinician=body.clinician,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return get_patient_detail(db, patient_id)


@router.put("/patients/{patient_id}/diagnoses/clinical/{clinical_id}")
def edit_clinical_diagnosis(
    patient_id: int, clinical_id: int, body: ClinicalDiagnosisRequest, db: Session = Depends(get_db)
):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.diagnosis.strip():
        raise HTTPException(status_code=400, detail="Diagnosis is required")
    try:
        update_clinical_diagnosis(
            db,
            patientunitstayid=patient_id,
            clinical_id=clinical_id,
            diagnosis=body.diagnosis,
            status=body.status,
            clinician=body.clinician,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return get_patient_detail(db, patient_id)


# ---------------------------------------------------------------------------
# Clinical notes (overlay; does not write to eICU `note` table)
# ---------------------------------------------------------------------------


class ClinicalNoteRequest(BaseModel):
    content: str
    note_type: str | None = "Clinician Note"
    author: str | None = None


@router.post("/patients/{patient_id}/notes/clinical")
def create_clinical_note(
    patient_id: int, body: ClinicalNoteRequest, db: Session = Depends(get_db)
):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Note content is required")
    try:
        add_clinical_note(
            db,
            patientunitstayid=patient_id,
            author=body.author,
            note_type=(body.note_type or "Clinician Note"),
            content=body.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return get_patient_detail(db, patient_id)


@router.put("/patients/{patient_id}/notes/clinical/{note_id}")
def edit_clinical_note(
    patient_id: int, note_id: int, body: ClinicalNoteRequest, db: Session = Depends(get_db)
):
    patient = get_patient_detail(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Note content is required")
    try:
        update_clinical_note(
            db,
            patientunitstayid=patient_id,
            note_id=note_id,
            author=body.author,
            note_type=(body.note_type or "Clinician Note"),
            content=body.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return get_patient_detail(db, patient_id)


# ---------------------------------------------------------------------------
# Agent chat – both routes fetch full patient data from DB and pass to Gemini
# ---------------------------------------------------------------------------

class ChatHistoryMessage(BaseModel):
    role: str
    text: str


class AgentContext(BaseModel):
    page: Optional[str] = None
    patient_name: Optional[str] = None
    clinical_status: Optional[str] = None
    primary_diagnosis: Optional[str] = None


class AgentChatRequest(BaseModel):
    patient_id: int
    message: str
    history: Optional[list[ChatHistoryMessage]] = []
    context: Optional[AgentContext] = None


@router.post("/agent/chat/stream")
async def agent_chat_stream(body: AgentChatRequest, db: Session = Depends(get_db)):
    patient = get_patient_detail(db, body.patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    history = [h.model_dump() for h in (body.history or [])]

    return StreamingResponse(
        stream_agent_response(
            patient=patient,
            message=body.message,
            history=history,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/agent/chat")
async def agent_chat(body: AgentChatRequest, db: Session = Depends(get_db)):
    """Non-streaming fallback – returns full reply at once."""
    patient = get_patient_detail(db, body.patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    history = [h.model_dump() for h in (body.history or [])]
    full_reply = ""

    async for chunk in stream_agent_response(
        patient=patient,
        message=body.message,
        history=history,
    ):
        if chunk.startswith("data: "):
            data = json.loads(chunk[6:].strip())
            if data.get("type") == "delta":
                full_reply += data.get("text", "")

    return {"reply": full_reply}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@router.get("/")
def root():
    return {"status": "ok", "service": "eICU API"}
