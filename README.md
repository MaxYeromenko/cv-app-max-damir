# 📄 CV App (Team CV Network)

A web application for creating, viewing, and managing team members' resumes (CVs).

## 🛠 Tech Stack

| Part | Technologies |
|---|---|
| Backend | Python, FastAPI, Pydantic, Motor/PyMongo (async), slowapi (rate limit) |
| Database | MongoDB (`users.cvs`) |
| Frontend | HTML, TypeScript, SCSS, Vanilla JS |
| Deploy | Vercel (frontend), Render (API) |

## 📁 Project Structure

```
.
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # API endpoints
│   │   ├── schemas.py     # Pydantic CV models
│   │   ├── db.py          # MongoDB connection
│   │   └── logging_config.py
│   ├── tests/             # pytest tests (API, DB, schemas)
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env               # secrets (not committed)
├── frontend/              # Static frontend
│   ├── index.html         # Home page
│   ├── catalog.html       # CV catalog
│   ├── member.html        # Single CV view
│   ├── add-member.html    # Create CV
│   ├── public/
│   └── src/
│       ├── ts/            # TypeScript sources
│       ├── js/            # built JS
│       └── scss/          # styles
└── vercel.json            # rewrites all paths to frontend
```

## 🚀 Running the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://...
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

Run:

```bash
uvicorn app.main:app --reload
```

- Swagger: http://127.0.0.1:8000/docs

## ⚡ Running the Frontend

```bash
cd frontend
npm install
npm run watch   # build TS → JS (watch.mjs)
```

Open `frontend/index.html` in your browser or serve the folder as static files.

The API URL is defined in the frontend: `frontend/src/ts/_types.ts` (`API_URL`).

## 🔌 API

Base path: `/api/v1/users-cvs`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Healthcheck |
| GET | `/api/v1/users-cvs` | List CVs (pagination via `skip`, `limit` ≤ 100) |
| GET | `/api/v1/users-cvs/{user_id}` | Single CV by ObjectId |
| POST | `/api/v1/users-cvs` | Create a CV |
| PUT | `/api/v1/users-cvs/{user_id}` | Partial update (allowlisted fields only) |
| DELETE | `/api/v1/users-cvs/{user_id}` | Delete a CV |

Rate limit: 20–30 requests/minute depending on the endpoint.

Example CV payload — `backend/tests/request_example.json`.

### 📑 CV Structure

- `photo` — photo URL
- `personal_info` — name, email, phone, date of birth, nationality, gender, etc.
- `languages`, `work_experience`, `scientific_interests`, `publications`, `awards`
- `favorite_subjects_in_school`, `programming_skills`, `device_access`, `hobbies`

## 🧪 Tests

```bash
cd backend
pytest
```

Markers: `api_test`, `db_test`, `schemas_test` (see `backend/pytest.ini`).

## 🚢 Deployment

- **Frontend** — Vercel: all paths are rewritten to `/frontend/` (`vercel.json`).
- **Backend** — Render (or any ASGI host): `uvicorn app.main:app`.
- Environment variables are configured in the hosting settings; `backend/.env` is not committed to git.
