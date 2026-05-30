# AI Documentation Assistant

A production-ready RAG (Retrieval Augmented Generation) web application for engineering teams to upload internal documentation (PDF/DOCX/TXT) and ask natural-language questions about it.

## Stack

- **Frontend:** Vue 3 + Vuetify 3 + Pinia + Vue Router + Axios (Vite)
- **Backend:** Node.js + Express + TypeScript (clean architecture)
- **DB:** PostgreSQL (raw SQL migrations, `pg` driver)
- **Vector DB:** ChromaDB
- **Cache / Queue:** Redis (BullMQ for background processing)
- **AI:** Google Gemini (chat + embeddings)
- **Auth:** JWT access + refresh token rotation, bcrypt, RBAC (Admin / Editor / Viewer)
- **Validation:** Zod
- **Docs:** Swagger UI at `/api/docs`
- **Containerization:** Docker + Docker Compose

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY plus the two JWT secrets
docker compose up --build
```

Then open:

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs

The backend runs DB migrations automatically on boot and seeds a default admin:

- Email: `admin@example.com`
- Password: `Admin12345!`

**Change this password immediately in production.**

## Local development (without Docker)

You still need Postgres, Redis, and ChromaDB running locally (compose can be used for only those services).

```bash
# Start infra only
docker compose up postgres redis chromadb

# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Architecture

```
backend/src
 ├── config/         env + DI container
 ├── modules/        feature modules (auth, documents, chat, search, admin)
 │    └── <feature>/{controller,service,repository,routes,validators}.ts
 ├── middleware/     auth, rbac, error handler, rate limit
 ├── jobs/           BullMQ workers (document processing pipeline)
 ├── utils/          logger, hashing, text utils
 ├── db/             pg pool + migrations + runner
 └── server.ts       app bootstrap
```

### RAG pipeline

1. Upload → file saved by Multer → row inserted with `status=pending` → job queued.
2. Worker: extract text (pdf-parse / mammoth / fs) → clean → chunk (≈800 tokens, 100 overlap) → embed via Gemini → upsert into Chroma collection `documents` with metadata `{documentId, chunkIndex, page}`.
3. Question: embed query → Chroma similarity search (k=5) → build prompt with citations → Gemini chat → return `{answer, confidence, sources[]}`.

### Security

- Helmet, CORS allowlist, express-rate-limit on `/api/auth/*` and `/api/chat/*`.
- All input validated with Zod.
- Parameterised SQL via `pg`.
- Passwords hashed with bcrypt (12 rounds).
- Refresh tokens stored hashed in DB with rotation + reuse detection.
- RBAC enforced at route layer.

## Tests

```bash
cd backend
npm test
```

## License

MIT
