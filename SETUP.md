# Setup guide: what loads, where it comes from, what to put where

You run three things on your own machine: **PostgreSQL**, the **backend** (port 8000) and the **frontend** (port 3000).
Nothing needs deploying. After starting everything, open **http://localhost:3000/status**: it checks each item below
live and tells you what is missing and what to do.

## 1. The two env files

**`backend/.env`** (copy from `backend/.env.example`)
| Variable | Put |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASSWORD@localhost:5432/football_ai` |
| `REPOSITORY_BACKEND` | `postgres` (the default `memory` saves nothing) |
| `ADMIN_API_KEY` | any long random string you choose |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` |
| `ODDS_API_KEY`, `ODDS_API_USE_MOCK` | leave blank / `true` until you want live odds (see `backend/docs/odds-api-credit-safety.md`) |

**`frontend/.env.local`** (copy from `frontend/.env.example`)
| Variable | Put |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| `ADMIN_API_KEY` | **the same value as in `backend/.env`**. Server-only: it is never sent to the browser, so you never type it into the website. |

Restart the frontend after editing `.env.local`.

## 2. Start order
```bash
# PostgreSQL running, empty database "football_ai" created
cd backend && pip install -r requirements.txt && alembic upgrade head
python -m uvicorn app.main:app --port 8000     # leave running
# new terminal
cd frontend && npm install && npm run dev      # http://localhost:3000
```

## 3. Getting data in (the database starts empty, on purpose)
| Step | Command | What it unlocks |
|---|---|---|
| Historical results | `cd backend && python scripts/import_results_csv.py results.csv --competition "Premier League" --country England` | Matches, Results, Teams, Statistics, form, head-to-head, analysis |
| Train models | `python scripts/train_models.py` (needs 100+ finished matches) | Creates candidate models |
| Promote models | Frontend > Model registry > **Validate**, then **Promote** each | Predictions, probabilities, Performance |
| Upcoming fixtures + odds | Frontend > Setup & status > **Refresh odds** (tick *create upcoming fixtures*) | Dashboard "Upcoming", Odds, Betslip |

CSV format (the free football-data.co.uk layout): required columns `Date, HomeTeam, AwayTeam, FTHG, FTAG`;
optional `Time, HS, AS, HST, AST, HC, AC, HF, AF, HY, AY, HR, AR`. Re-importing a file never duplicates rows.

## 4. Which page needs what
| Page | Needs |
|---|---|
| Dashboard | matches (upcoming and finished), models |
| Matches / Competitions / Teams | imported results or fixtures |
| Match detail: form, H2H, goals, stats | finished matches before that match |
| Match detail: prediction | production models (then press *Generate prediction*) |
| Match detail / Odds / Betslip: odds | a refresh from the Odds API (mock file or live key) |
| Performance / Model registry | trained models |
| Results | finished matches that have stored predictions |
| Statistics | finished matches for the chosen team |

## 5. What is NOT available (no data source exists in the backend)
SofaScore, Betika and SportPesa adapters in `backend/app/data/collectors/` are placeholders (no documented public
API), so there is no automatic stats ingestion, injuries/squad data, or xG; those sections show "N/A" or empty states.
Real bookmaker odds come through The Odds API aggregator instead. Details: `frontend/docs/api-integration-issues.md`.

## 6. Security note
The admin proxy (`frontend/app/api/admin/*`) has no user login. That is fine on localhost. If you ever put the frontend on
a public address, put it behind authentication first, because anyone who can reach it could press Promote/Refresh.
