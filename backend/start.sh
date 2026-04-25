#!/bin/bash
set -e
echo "=== Initializing database ==="
python load_data.py
echo "=== Starting server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
