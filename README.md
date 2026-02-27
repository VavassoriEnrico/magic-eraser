# Magic Eraser (backend + minimal React UI)

Minimal setup to run and test the API locally, plus a minimal React UI (HeroUI) to verify backend and database communication.

## Prerequisites

- Python 3.12+
- PostgreSQL running locally (or reachable from your machine)
- `pip`

## 1) Create and activate virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

## 2) Install dependencies

```bash
pip install fastapi uvicorn sqlalchemy python-dotenv psycopg2-binary python-multipart
```

## 3) Configure environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://simpleuser:password@localhost:5432/db
```

Notes:
- Keep 'simpleuser', 'password' and 'db' as they are now or choose you custom names (I suggest to keep them as they are).

## 4) Run the API

From `backend/`:

```bash
uvicorn main:app --reload
```

Server will be available at:
- `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

## 5) Quick test

Create a project:

```bash
curl -X POST "http://127.0.0.1:8000/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"test project"}'
```

List projects:

```bash
curl "http://127.0.0.1:8000/projects"
```

## 6) Run minimal frontend UI (React + HeroUI)

From project root:

```bash
cd frontend
cp .env
npm install
npm run dev
```

Frontend will be available at:
- `http://127.0.0.1:5173`

If backend runs on a different URL/port, update `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## 7) Test flow from UI

1. Create a project from the `Projects` panel.
2. Select a project and upload an image from your computer from `Images`.
3. Refresh to verify persistence from database.
4. Delete images/projects to verify delete endpoints.
