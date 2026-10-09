# Football AI Analysis and Prediction Platform — Backend

Production-grade backend for football match analysis and prediction,
with a PostgreSQL persistence layer. No frontend is included.

Persistence is behind repository interfaces
(`app/repositories/interfaces/`) with two working implementations: an
in-memory one (the default, zero external dependencies) and a real
SQLAlchemy/PostgreSQL one — selected by the `REPOSITORY_BACKEND`
environment variable (`memory` or `postgres`). See
`docs/database-requirements.md`, `docs/database-integrity-review.md`,
and `docs/database-audit.md` for the full design rationale and
verification history of the database layer.

## Architecture

```
app/
  api/            FastAPI routes + dependency wiring (repository_backend switch)
  core/           config, logging, exceptions, security
  data/           collectors (provider adapters), schemas, normalization, validation
  db/             SQLAlchemy engine/session (app/db/session.py) + ORM models (app/db/models.py)
  features/       time-aware feature engineering (leakage-guarded)
  ml/             models, training, prediction, evaluation, registry
  analysis/       MatchAnalyzer / TeamAnalyzer / explanation engine
  learning/       result evaluation, performance tracking, drift, retraining
  repositories/   interfaces + in-memory AND PostgreSQL implementations
  services/       business logic consumed by API routes
alembic/          migrations (one initial schema migration; see alembic/versions/)
docs/             database design audit, integrity review, seed-data rationale, final audit
scripts/          seed_dev_fixtures.py — isolated, safety-gated local dev fixtures
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` / `TEST_DATABASE_URL` to your own
PostgreSQL instance and credentials (the checked-in `.env.example`
contains placeholders only — never real credentials). Two separate
databases are expected: one for the app, one dedicated to the test
suite's destructive operations (its name must contain "test" — enforced
by `app/db/session.py::assert_safe_test_database_url`).

Apply the schema:

```bash
alembic upgrade head
```

Optionally seed a small, clearly-fake local dataset to browse at `/docs`
(see `docs/database-seed-data.md` for what this does and doesn't seed):

```bash
python scripts/seed_dev_fixtures.py --yes-seed-dev-fixtures
```

## Running

```bash
uvicorn app.main:app --reload
```

By default the app runs with `REPOSITORY_BACKEND=memory` (no database
required). Set `REPOSITORY_BACKEND=postgres` in `.env` to run against
the PostgreSQL schema instead.

Interactive API docs: `http://localhost:8000/docs`

## Testing / linting / type-checking

```bash
pytest
ruff check .
mypy app
```

Database-backed tests (anything under `tests/integration/test_db_*`,
`test_postgres_*`, `test_alembic_*`, `test_full_system_integration.py`)
run against `TEST_DATABASE_URL` and skip automatically — the rest of the
suite still passes — if no PostgreSQL server is reachable there.

## Data sources

- **SofaScore** — football-data / statistics provider (`app/data/collectors/sofascore.py`)
- **Betika**, **SportPesa** — bookmaker odds providers (`app/data/collectors/betika.py`, `sportpesa.py`)

These adapters implement the full HTTP/retry/rate-limit/health plumbing,
but ship with **placeholder endpoint paths** — none of these providers
publish a documented public API for third-party data access, and this
codebase does not implement scraping, CAPTCHA bypass, or any method to
circumvent authentication or rate limits. See each adapter's module
docstring for how to activate it once a legitimate, documented data
source is configured. Until configured, calls raise
`ProviderNotConfiguredError` — never fabricated data.

## Model lifecycle

Models move through `candidate -> validated -> production -> retired`.
Training always produces a `candidate`; promotion to `production` is a
separate, explicit action (`POST /api/v1/models/{id}/promote`, admin-only)
and never happens automatically from training or drift detection.

## Database notes

- **Model registry stays file-based.** `ModelRegistry` persists itself
  via a local JSON index + joblib artifacts regardless of
  `REPOSITORY_BACKEND`. A `model_registry_entries` table exists in the
  schema (designed for a future migration) but has no writer in the app
  today — see `docs/database-audit.md` §8/§11 for why this was
  deliberately deferred rather than forced through.
- **No destructive test operation can hit the wrong database.**
  `assert_safe_test_database_url` refuses to run unless the test URL is
  both distinct from `DATABASE_URL` and has "test" in its database name.

## Key architectural guarantees

- Odds (bookmaker) and football statistics are modelled and stored separately.
- Every feature is computed using only information available strictly
  before the match's kickoff (`app/features/_types.py::before_cutoff`).
- Every prediction is stored (append-only) before the match result is known,
  and is evaluated — never mutated — once the result is known.
- Every trained model carries full metadata (algorithm, feature-set
  version, dataset version, training period, metrics) and past versions
  are retired, never deleted, on promotion of a new one.
