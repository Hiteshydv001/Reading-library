# Reading Library (E-Library)

This repository contains a personal reading library application. It consists of a backend API that extracts and stores link metadata (title, summary, tags, images, scheduled reading times) and a frontend single-page application for browsing and managing saved links.

## Project summary

- Backend: FastAPI (Python). Responsibilities:
  - Connects to MongoDB to store links and user accounts
  - Provides authenticated REST endpoints for links, tags, and stats
  - Accepts Telegram webhook payloads to add links automatically
  - Handles authentication using JWT

- Frontend: React + Vite + TypeScript. Responsibilities:
  - Provides a responsive UI to list, search, filter, schedule, and mark links as read or favorite
  - Handles user login and stores access tokens in local storage
  - Calls the backend API to read and modify data

- Data store: MongoDB (Atlas or self-hosted)

## Repository layout

```
my-elibrary/
  backend/         # FastAPI app, database, models, scraper
  frontend/        # Vite + React frontend
  Dockerfile
  docker-compose.yml
  README.md
```

## Environment variables

Backend (required)
- `MONGODB_URL` — MongoDB connection URI
- `DB_NAME` — database name
- `SECRET_KEY` — JWT signing secret
- `ALGORITHM` — JWT algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — default: `1440`

Optional (backend)
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` — used to create/update a default admin account on startup
- `TELEGRAM_BOT_TOKEN` — for Telegram webhook integration
- `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins (e.g., `https://reading-library.vercel.app,http://localhost:5173`)

Frontend
- `VITE_API_BASE` — base URL for the backend API (must include protocol, e.g., `https://reading-library.onrender.com`)

Placeholders are provided in `backend/.env.example` and `frontend/.env.example`. Do not commit real secrets to the repo.

## API highlights

- `GET /health` — health check
- `POST /api/auth/login` — returns access token
- `GET /api/links` — list links with pagination and filters
- `GET /api/links/{id}` — single link
- `PATCH /api/links/{id}` — update link
- `DELETE /api/links/{id}` — delete link
- `GET /api/tags` — all tags
- `GET /api/stats` — library statistics
- `POST /webhooks/telegram` — endpoint for Telegram webhook messages

When the backend is running you can visit `/docs` for the interactive OpenAPI docs.

## Running locally

Backend

1. Copy `backend/.env.example` to `backend/.env` and fill required values.
2. Install dependencies and run:

```
cd backend
python -m venv .venv
# activate the venv, then:
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend

1. Set `VITE_API_BASE` in `frontend/.env` or in your environment.
2. Install dependencies and run:

```
cd frontend
npm install
npm run dev
```

## Deployment notes

Backend on Render (recommended)
- Set environment variables in Render's dashboard and mark secrets.
- Ensure `ALLOWED_ORIGINS` includes your frontend host.
- Start command: `gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 1`

Frontend on Vercel
- Set the project root to `frontend` and add `VITE_API_BASE` to Vercel environment variables.
- Build command: `npm run build`, output directory: `dist`.

## Troubleshooting

- If the frontend is blank after deployment, verify static files are served with correct MIME types and that Vercel's `vercel.json` contains a filesystem handle before the SPA fallback.
- If browser requests are blocked by CORS, ensure `ALLOWED_ORIGINS` on the backend includes the frontend domain.
- If login fails, confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set on the backend and that the backend has been restarted so the admin account is created.

## Contributing and next steps

- Add tests, CI checks, and automated deploys.
- Consider adding a small admin setup script and monitoring for production.

If you want, I can add a `render.yaml` for the backend or a small debug endpoint to verify CORS headers. Let me know which you'd like.

