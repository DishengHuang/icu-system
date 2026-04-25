# eICU Full-Stack Backend

## Project structure

```
backend/
├── main.py                        ← FastAPI app entry-point
├── load_data.py                   ← One-time CSV → SQLite loader
├── requirements.txt
├── eicu.db                        ← SQLite database (created by load_data.py)
├── data/                          ← Place all *_csv.gz files here
│   ├── patient_csv.gz
│   ├── vitalPeriodic_csv.gz
│   └── … (31 tables total)
└── app/
    ├── core/
    │   └── database.py
    ├── api/
    │   └── routes.py
    └── services/
        ├── patient_service.py
        └── agent_service.py
```

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
# Linux / macOS
export ANTHROPIC_API_KEY=sk-ant-...

# Windows
set ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Place CSV data and load into SQLite
```bash
mkdir data
# Copy all *_csv.gz files into data/
python load_data.py
```

### 4. Start the server
```bash
uvicorn main:app --reload --port 8000
```

The API is now available at `http://127.0.0.1:8000/api`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (mock) |
| GET | `/api/patients` | Patient list (optional `?q=search`) |
| GET | `/api/patients/{id}` | Full patient detail |
| POST | `/api/agent/chat/stream` | Streaming AI chat (SSE) |
| POST | `/api/agent/chat` | Non-streaming AI chat |

## Login credentials (mock)
- `doctor@example.com` / `doctor123`
- `nurse@example.com` / `nurse123`

## Docker
```bash
docker build -t eicu-backend .
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v $(pwd)/eicu.db:/app/eicu.db \
  eicu-backend
```
