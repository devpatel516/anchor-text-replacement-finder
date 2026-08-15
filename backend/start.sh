#!/bin/bash
set -e

echo "Starting FastAPI AI Service on port 8000..."
python3 -m uvicorn services.ai:app --host 127.0.0.1 --port 8000 &

echo "Starting Node.js Express API Server on port ${PORT:-5000}..."
exec node server.js
