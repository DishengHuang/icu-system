"""
Load all eICU CSV.GZ files into eicu.db (SQLite).

Run from backend folder:
    python load_data.py

Make sure all *_csv.gz files are inside:
    backend/data/
"""

import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "eicu.db"

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

TABLES = [
    ("admissiondrug_csv", "admissiondrug"),
    ("admissionDx_csv", "admissiondx"),
    ("allergy_csv", "allergy"),
    ("apacheApsVar_csv", "apacheapsvar"),
    ("apachePatientResult_csv", "apachepatientresult"),
    ("apachePredVar_csv", "apachepredvar"),
    ("carePlanCareProvider_csv", "careplancareprovider"),
    ("carePlanEOL_csv", "careplaneol"),
    ("carePlanGeneral_csv", "careplangeneral"),
    ("carePlanGoal_csv", "careplangoal"),
    ("carePlanInfectiousDisease_csv", "careplaninfectiousdisease"),
    ("customLab_csv", "customlab"),
    ("diagnosis_csv", "diagnosis"),
    ("hospital_csv", "hospital"),
    ("infusiondrug_csv", "infusiondrug"),
    ("intakeOutput_csv", "intakeoutput"),
    ("lab_csv", "lab"),
    ("medication_csv", "medication"),
    ("microLab_csv", "microlab"),
    ("note_csv", "note"),
    ("nurseAssessment_csv", "nurseassessment"),
    ("nurseCare_csv", "nursecare"),
    ("nurseCharting_csv", "nursecharting"),
    ("pastHistory_csv", "pasthistory"),
    ("patient_csv", "patient"),
    ("physicalExam_csv", "physicalexam"),
    ("respiratoryCare_csv", "respiratorycare"),
    ("respiratoryCharting_csv", "respiratorycharting"),
    ("treatment_csv", "treatment"),
    ("vitalAperiodic_csv", "vitalaperiodic"),
    ("vitalPeriodic_csv", "vitalperiodic"),
]


def load_table(csv_stem: str, table_name: str) -> None:
    path = DATA_DIR / f"{csv_stem}.gz"

    if not path.exists():
        print(f"  ✗ {table_name:35s} FILE NOT FOUND - {path}", file=sys.stderr)
        return

    try:
        print(f"  → Loading {table_name} from {path.name} ...")
        df = pd.read_csv(path, compression="gzip", low_memory=False)

        # Standardize all column names to lowercase
        df.columns = [c.lower() for c in df.columns]

        df.to_sql(
            table_name,
            engine,
            if_exists="replace",
            index=False,
            chunksize=50000,
        )

        print(f"  ✓ {table_name:35s} {len(df):>10,} rows")

    except Exception as exc:
        print(f"  ✗ {table_name:35s} ERROR: {exc}", file=sys.stderr)


def create_indexes() -> None:
    """Add patientunitstayid indexes for faster patient-level lookups."""
    indexed = [
        "admissiondrug",
        "admissiondx",
        "allergy",
        "apacheapsvar",
        "apachepatientresult",
        "apachepredvar",
        "careplancareprovider",
        "careplangeneral",
        "careplangoal",
        "careplaninfectiousdisease",
        "diagnosis",
        "infusiondrug",
        "intakeoutput",
        "lab",
        "medication",
        "microlab",
        "note",
        "nurseassessment",
        "nursecare",
        "nursecharting",
        "pasthistory",
        "physicalexam",
        "respiratorycare",
        "respiratorycharting",
        "treatment",
        "vitalaperiodic",
        "vitalperiodic",
    ]

    with engine.connect() as conn:
        for tbl in indexed:
            try:
                conn.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_pid "
                        f"ON {tbl} (patientunitstayid)"
                    )
                )
            except Exception:
                pass
        conn.commit()

    print("  ✓ indexes created")


if __name__ == "__main__":
    # Skip loading if DB already has data (e.g. persistent disk or dev reuse)
    if DB_PATH.exists():
        try:
            with engine.connect() as conn:
                count = conn.execute(text("SELECT COUNT(*) FROM patient")).scalar()
            if count and count > 0:
                print(f"Database already loaded ({count} patients). Skipping.")
                sys.exit(0)
        except Exception:
            pass

    print(f"\nLoading eICU tables into: {DB_PATH}\n")
    print(f"Data directory: {DATA_DIR}\n")

    if not DATA_DIR.exists():
        print("ERROR: data/ folder not found!", file=sys.stderr)
        sys.exit(1)

    for stem, tbl in TABLES:
        load_table(stem, tbl)

    print("\nCreating indexes ...")
    create_indexes()

    print("\nDone.")