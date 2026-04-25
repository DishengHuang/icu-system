# eICU Full-Stack App (C Version)

This package upgrades the starter into a **FastAPI + Next.js** full-stack ICU app with 15 pages:

1. Login  
2. Dashboard  
3. Patient List / ICU Census  
4. Patient Summary  
5. Vitals  
6. Labs  
7. Medication & Infusion  
8. Intake / Output  
9. Respiratory  
10. Diagnosis / Problem List  
11. Notes  
12. Nursing Documentation  
13. Care Plan  
14. Severity / Risk / Alerts  
15. Hospital / Unit Dashboard

## Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`.

## Starter login

- email: `doctor@example.com`
- password: `doctor123`

## Notes

- The app is wired to the existing starter backend.
- Patient-specific pages use the backend plus demo enrichments so the 15-page workflow is visible immediately.
- You can later replace the demo enrichments with direct reads from your eICU tables.


## Full eICU backend data coverage
This package now includes all 31 eICU `.csv.gz` tables under `data/` and a DuckDB-backed API layer that reads them directly.

### New backend endpoints
- `GET /api/meta/tables` — list all 31 tables, columns, row counts
- `GET /api/patients-full` — patient list backed by real eICU tables
- `GET /api/patients/{patient_id}/table-summary` — row counts per table for one stay
- `GET /api/patients/{patient_id}/bundle` — connected patient bundle across all patient-linked tables
- `GET /api/patients/{patient_id}/timeline` — unified timeline across vitals, labs, meds, notes, respiratory, diagnosis, treatment
- `GET /api/tables/{table_name}?patient_id=...` — generic raw-table endpoint

The backend links data primarily by `patientunitstayid`, and joins `patient.hospitalid -> hospital.hospitalid`.
