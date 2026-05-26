# ATRF

ATRF is a three-part local app for crawling relevant pages from a submitted URL, extracting page content, and generating an AI-assisted editorial link placement suggestion. It now includes account authentication, plan-based authorization, and monthly analysis limits.

## Tech Stack

- Frontend: React + Vite
- API server: Node.js + Express
- Auth, billing, and usage tracking: JWT + MongoDB + Stripe
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
MONGODB_URI=your_actual_mongodb_uri
MONGODB_DB_NAME=your_database_name
JWT_SECRET=your_long_random_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_stripe_price_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
FRONTEND_URL=http://localhost:5173
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

1. A user signs up or logs in from the React frontend.
2. The Node backend verifies the JWT and loads the user plan from MongoDB.
3. Free users can run 3 analyses per month. Pro users can run 100 analyses per month.
4. The frontend sends the protected form input to the Node backend.
5. The Node backend crawls matching internal pages from the submitted URL.
6. The backend extracts title and paragraph content from each crawled page.
7. The backend forwards the extracted data to the FastAPI service.
8. The FastAPI service uses Gemini to return the best matching editorial-link scenario.
9. The backend increments the user's monthly analysis usage after a successful run.
10. The frontend displays the selected scenario, crawled page links, and the updated remaining quota.

## Authentication And Billing

- `POST /api/auth/register`: Create a user account and return a JWT
- `POST /api/auth/login`: Sign in and return a JWT
- `GET /api/auth/me`: Return the authenticated user profile, plan, and remaining monthly analyses
- `POST /api/extract`: Protected route that checks plan limits before running analysis
- `POST /api/billing/create-checkout-session`: Protected Stripe checkout session for the Pro plan
- `GET /api/billing/checkout-session/:sessionId`: Confirms a successful Stripe checkout and upgrades the user to Pro
- `POST /api/billing/webhook`: Optional Stripe webhook endpoint for automatic subscription sync

## Monthly Usage Rules

- Free plan: 3 analyses per month
- Pro plan: 100 analyses per month
- Usage resets automatically when the current month changes
- Upgrading to Pro keeps the same account and increases the current monthly limit to 100

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

### Stripe checkout completes but the plan does not upgrade

Check these:

- `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` are valid in `backend/.env`
- `FRONTEND_URL` matches the URL where the React app is running
- If you use webhooks locally, `STRIPE_WEBHOOK_SECRET` matches your Stripe CLI forwarding secret
