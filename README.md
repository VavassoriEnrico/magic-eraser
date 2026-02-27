# Magic Eraser

Run the full project (PostgreSQL + FastAPI backend + React frontend) with Docker Compose.

## Prerequisites

- Docker
- Docker Compose plugin (`docker compose` command)

## Start everything

From project root:\
If it's the first time:
```bash
docker compose up --build
```

If you already built it before:
```bash
docker compose up --d
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432` (user: `simpleuser`, password: `password`, db: `db`)

## Stop everything

```bash
docker compose down
```

## Stop and delete volumes (full reset)

```bash
docker compose down -v
```

## Notes

- Database data is persisted in the `postgres_data` Docker volume.
- Uploaded images are persisted in the `backend_uploads` Docker volume.
- Frontend is built with `VITE_API_URL=http://localhost:8000`.
