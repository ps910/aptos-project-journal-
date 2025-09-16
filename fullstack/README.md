# Blockchain Open Journal — Fullstack Scaffold

This scaffold provides a minimal fullstack app for your Move module `OpenJournal`.

Structure:
- `backend/` — Express server with mock in-memory storage and optional Aptos wiring
- `frontend/` — React + Vite frontend that calls the backend

Quick start (Windows PowerShell):

1. Backend

```powershell
cd "c:\Users\pramo\Desktop\aptos project\fullstack\backend"
npm install
# Copy .env.example to .env and edit if you want to enable Aptos mode
copy .env.example .env
npm run dev
```

2. Frontend

```powershell
cd "c:\Users\pramo\Desktop\aptos project\fullstack\frontend"
npm install
npm run dev
```

Notes:
- The backend runs in a mock mode by default and implements routes:
  - GET /api/health
  - GET /api/ideas
  - POST /api/ideas { title, description }
  - POST /api/ideas/:id/vote
  - GET /api/ideas/:id

- If you want the backend to submit transactions to Aptos, set `USE_APTOS=true` in `.env` and provide `APTOS_NODE_URL` and `APTOS_PRIVATE_KEY`. The exact transaction payloads to call your Move module are not implemented in this scaffold because they require verifying your Move package address and ABI. I can add that next if you provide:
  - The on-chain package address where `MyModule::OpenJournal` is published
  - The Move ABI / function signatures (or allow me to compile the Move sources here)

Aptos wiring and wallet options
- Server-side signing: set `USE_APTOS=true`, `APTOS_PRIVATE_KEY` (hex) and `APTOS_MODULE_ADDR` (example: `0x1::`) in `backend/.env`. The backend will sign and submit transactions using the Aptos SDK.
- The backend also persists ideas locally to `fullstack/backend/data.db` (SQLite). This allows the frontend to list ideas even when not reading many on-chain resources directly.

Note: `JOURNAL_OWNER_ADDRESS` in `fullstack/backend/.env` has been set to the address you provided for testing: `0x00a80aa770fac015bd9908082010b4ec24b6bc5233383b584cf68e90a17fd964`.
- Browser wallet signing: the frontend detects `window.aptos` (Martian/Petra style wallets). Users can sign transactions in-browser; frontend currently provides a connect button and falls back to server submission when wallet-based transaction payloads are not implemented.

To fully enable server-side Move calls I need the published module address and confirmation of the Move entry signatures. If you want me to implement the exact entry-function payloads I can do that once you provide the module address and whether to use server private key or wallet signing.

Frontend wallet env:
- You can set `VITE_APTOS_MODULE_ADDR` in the frontend environment to let the UI build wallet payloads. Create a file `fullstack/frontend/.env` with:
```
VITE_APTOS_MODULE_ADDR=0xYourModuleAddress
VITE_API_BASE=http://localhost:4000/api
```

Next steps I can take for you:
- Wire the backend to call your Move entry functions (I will need the module address and private key)
- Add wallet-based frontend interaction (e.g., using Martian or Pontem wallet) so users sign transactions directly from browser
- Add persistent storage (SQLite/Postgres) for indexing and faster reads

If you'd like, I'll now implement Aptos transaction wiring — tell me the module address and whether to use the private key in `.env` or to sign in-browser.
