# QuickClip Monorepo

This repository contains the QuickClip pastebin & URL shortener SaaS application with a Node.js/Express backend and a React frontend. The project is structured as a simple monorepo with `backend/` and `frontend/` workspaces plus Docker Compose helpers for local development and production.

## Prerequisites
- Node.js 22+ for the backend (see `backend/package.json`)
- Node.js 18+ works for the CRA frontend
- Docker (optional) if you want to use the compose files

## Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env    # if you maintain an example file

# Frontend
cd ../frontend
npm install
cp .env.example .env    # if applicable
```

## Running
- Backend: `npm run dev` for local development, `npm start` for production-like start. Additional scripts: `npm run migrate`, `npm run seed`, `npm run test`.
- Frontend: `npm start` for local dev, `npm run build` for production build, `npm test` for the CRA test runner.
- Docker: use `docker-compose.dev.yml` or `docker-compose.prod.yml` depending on the environment.

## Repo notes
- `.gitignore` is configured for Node/React build artifacts, env files, and editor cruft.
- Keep secrets in environment files rather than committing them to the repo.

