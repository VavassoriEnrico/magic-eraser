# Magic Eraser

Run the full project (PostgreSQL + FastAPI backend + React frontend) with Docker Compose.

## Prerequisites

- Docker
- Docker Compose plugin (`docker compose` command)

## Start everything
### No hot-reload

From project root:\
If it's the first time:
```bash
docker compose up --build
```

If you already built it before:
```bash
docker compose up -d
```
### Hot-reload

From project root:\
If it's the first time:
```bash
docker compose -f docker-compose.dev.yml up --build
```

If you already built it before:
```bash
docker compose -f docker-compose.dev.yml up -d
```


Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432` (user: `simpleuser`, password: `password`, db: `db`)


In this mode:
- Frontend runs with Vite dev server on `http://localhost:5173`
- Backend runs with Uvicorn `--reload` on `http://localhost:8000`
- DB remains in Docker as usual

Stop dev mode:

```bash
docker compose -f docker-compose.dev.yml down
```

## Stop everything

```bash
docker compose down
```

## Stop and delete volumes (full reset)

```bash
docker compose down -v
```


## TESTS
### frontend
```bash
cd frontend
npm run test
```

### backend (to implement)
```bash
cd backend
npm run test
```

## Notes

- Database data is persisted in the `postgres_data` Docker volume.
- Uploaded images are persisted in the `backend_uploads` Docker volume.
- Frontend is built with `VITE_API_URL=http://localhost:8000`.
- Frontend is now written in TypeScript and includes `npm run typecheck` and `npm run lint` in the `frontend` workspace.
