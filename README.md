# ATRF

ATRF is a three-part local app for crawling relevant pages from a submitted URL, extracting page content, and generating an AI-assisted editorial link placement suggestion.

## Tech Stack

- Frontend: React + Vite
- API server: Node.js + Express
- AI service: FastAPI + LangChain + Gemini
- Crawling: Playwright

## Project Structure

```text
ATRF/
|- frontend/                # React client
|- backend/                 # Express API + FastAPI service code
|  |- controllers/
|  |- routes/
|  |- services/
|  |  |- ai.py             # FastAPI AI service
|  |  |- crawlerService.js
|  |  |- extractorService.js
|  |- .env.sample
|  |- requirements.txt
|- README.md
```

## Prerequisites

Install these before starting:

- Node.js 18+ and npm
- Python 3.10+ and pip
- A Gemini API key

## 1. Clone The Project

```bash
git clone <your-repo-url>
cd ATRF
```

## 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## 3. Install Backend Node Dependencies

```bash
cd backend
npm install
cd ..
```

## 4. Install Playwright Browser

The crawler uses Playwright with Chromium, so install the browser once after backend dependencies are installed.

```bash
cd backend
npx playwright install chromium
cd ..
```

## 5. Create And Activate A Python Virtual Environment

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 6. Install Python Dependencies

With the virtual environment activated:

```bash
pip install -r backend/requirements.txt
```

## 7. Configure Environment Variables

Create the backend environment file from the sample:

### Windows PowerShell

```powershell
Copy-Item backend/.env.sample backend/.env
```

### macOS / Linux

```bash
cp backend/.env.sample backend/.env
```

Then update `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

Frontend env config is optional for local development because Vite already proxies `/api` to `http://localhost:5000`.

If you want to point the frontend to a custom API base URL, create `frontend/.env` from `frontend/.env.example` and set:

```env
VITE_API_BASE_URL=
```

Leave it empty for the default local setup.

## 8. Start The App Locally

You need 3 terminals running at the same time.

### Terminal 1: FastAPI AI Service

Activate the virtual environment first, then run the AI service from the `backend` folder:

```bash
cd backend
uvicorn services.ai:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Node / Express Backend

```bash
cd backend
npm run dev
```

This starts the backend at `http://localhost:5000`.

### Terminal 3: React Frontend

```bash
cd frontend
npm run dev
```

This starts the frontend at `http://localhost:5173`.

## 9. Open The App

Visit:

```text
http://localhost:5173
```

## Request Flow

1. The frontend sends the form input to the Node backend.
2. The Node backend crawls matching internal pages from the submitted URL.
3. The backend extracts title and paragraph content from each crawled page.
4. The backend forwards the extracted data to the FastAPI service.
5. The FastAPI service uses Gemini to return the best matching editorial-link scenario.
6. The frontend displays the selected scenario and the crawled page links.

## Default Local Ports

- Frontend: `5173`
- Node backend: `5000`
- FastAPI AI service: `8000`

## Useful Health Checks

- Node backend: `http://localhost:5000/health`
- FastAPI AI service: `http://127.0.0.1:8000/healthAi`

## Troubleshooting

### `Failed to extract content`

Check these first:

- The FastAPI service is running on port `8000`
- The backend is running on port `5000`
- `backend/.env` contains a valid `GEMINI_API_KEY`

### Playwright browser errors

Run:

```bash
cd backend
npx playwright install chromium
```

### Python module not found

Make sure your virtual environment is activated and then reinstall:

```bash
pip install -r backend/requirements.txt
```

### Frontend cannot reach the backend

Make sure:

- `npm run dev` is running in `frontend/`
- `npm run dev` is running in `backend/`
- `frontend/vite.config.js` still proxies `/api` to `http://localhost:5000`

## Notes

- The repository currently ignores `.env`, `node_modules`, and `.venv`.
- The frontend local setup does not require `VITE_API_BASE_URL` unless you want a custom API URL.
