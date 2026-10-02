# Stochron — Foreboding Index (FI) Platform  

A financial sentiment analysis platform that scores news articles, earnings calls, filings, and regulatory disclosures using a transparent, **lexicon-based sentiment engine**, then tracks how that sentiment correlates with real market data over time.

Instead of a black-box ML score, the FI Platform measures sentiment as the ratio of *foreboding* language to *assurance* language in a document — an explainable approach in the same family as academic financial-sentiment dictionaries (e.g. Loughran–McDonald) — and lets users personalize it by hiding words and re-weighting document categories or individual articles.

---


## What It Does

- **Scores documents** against a shared "assurance vs. foreboding" word dictionary to produce a **Foreboding Index (FI)** score between 0 and 1.
- **Aggregates scores** across document categories (earnings calls, filings, regulatory disclosures, news) into a single weighted **Final Score**, and across articles into a **Daily FI**.
- **Classifies every score into a regime** — Stable → Watch → Alert → Critical — using fixed thresholds, so results are easy to interpret at a glance.
- **Correlates the FI signal against a real market index** (NIFTY IT) over time, using a from-scratch Pearson correlation, to check whether the sentiment signal actually tracks market movement.
- **Personalizes the model per user**: users can hide specific dictionary words they don't trust, re-weight document categories, and override individual article weights — with every recalculation happening live.
- Ships a **guest mode**: anonymous users see a global, un-personalized view; logged-in users see their own weighted view of the exact same data.

---

## Tech Stack

**Backend**
- FastAPI (Python) — REST API, auto request validation via Pydantic
- Supabase — PostgreSQL database, authentication (JWT), row-level security
- Plain Python for the scoring/aggregation engine (no ML libraries — deliberately explainable)

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI primitives) for the component library
- Recharts for data visualization
- React Router for navigation
- Supabase JS client for auth

---

## Architecture

```
Stochron-main/
├── backend/
│   ├── main.py                 # FastAPI app, router registration, CORS
│   ├── core/
│   │   ├── fi_engine.py        # All scoring & aggregation logic (pure functions, no I/O)
│   │   ├── auth.py             # JWT validation — strict & optional auth dependencies
│   │   └── supabase.py         # Supabase client initialization
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   └── routers/
│       ├── score_router.py     # POST /score, /score/aggregate — score a document, combine categories
│       ├── chart.py            # GET /chart-data — FI vs NIFTY IT time series (guest or personalized)
│       ├── mindmap.py          # GET /mindmap/{date} — per-article breakdown for one day
│       ├── articles.py         # PATCH /articles/{id}/weight — override an article's weight
│       ├── dictionary.py       # GET/POST/PATCH /dictionary/* — manage words & category weights
│       └── analysis.py         # GET /analysis — correlation, regime breakdown, interpretation
│
└── frontend/
    └── src/
        ├── app/components/     # NetworkGraph, DocumentNode, StockSelector, FinalAnalysis, DictionaryEditor, ...
        │   └── ui/              # shadcn/ui primitives (button, dialog, table, tabs, etc.)
        ├── lib/                 # AuthContext, DictionaryContext, api.ts, supabase.ts
        └── pages/               # Login.tsx
```

---

## How Scoring Works

**Per-document score:**
```
FI  = foreboding_word_count / (foreboding_word_count + assurance_word_count)
TFI = foreboding_word_count / total_word_count
```
`FI` ranges from 0 (all assurance language) to 1 (all foreboding language), and is 0.0 (not "critical") when no sentiment words are found at all.

**Regime thresholds** (applied to any 0–1 score):
| Score range | Regime |
|---|---|
| 0.00 – 0.25 | Stable |
| 0.25 – 0.50 | Watch |
| 0.50 – 0.75 | Alert |
| 0.75 – 1.00 | Critical |

**Cross-category aggregation:** categories without a scored document are excluded from *both* the weighted sum and the weight normalization, so a missing category never silently drags the Final Score down. If a user zeroes out every active category's weight, the engine falls back to an unweighted average rather than dividing by zero.

**Daily/article aggregation:** each day's FI is the weight-adjusted average of that day's article scores, using either the user's personal article weights (if logged in) or a default weight of 1.0 (guest view).

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Health check, lists available endpoints |
| `POST` | `/score` | Required | Score a single pasted/uploaded document against the active dictionary |
| `POST` | `/score/aggregate` | Required | Combine already-scored categories into a Final Score using the user's category weights |
| `GET` | `/chart-data` | Optional | FI vs. NIFTY IT time series — personalized if logged in, global if not |
| `GET` | `/mindmap/{date}` | Optional | All articles for a given date with per-article weighted contribution |
| `PATCH` | `/articles/{id}/weight` | Required | Override one article's weight; returns the recalculated daily FI instantly |
| `GET` | `/dictionary` | Optional | Full assurance/foreboding word list, flagged with which words this user has hidden |
| `PATCH` | `/dictionary/{word_id}/hide` \| `/unhide` | Required | Hide/restore a dictionary word for this user only |
| `GET` / `PUT` | `/dictionary/weights` | Required | Get or update this user's per-category weights (default 0.25 each) |
| `GET` | `/analysis` | Optional | Correlation coefficient between FI and NIFTY IT, regime breakdown, plain-language interpretation |

Interactive API docs are auto-generated by FastAPI at `/docs` once the backend is running.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Supabase project (URL + service role key)

### Backend
```bash
cd backend
pip install -r requirements.txt
```
Create a `.env` file in `backend/`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```
Run the API:
```bash
uvicorn main:app --reload
```
The API will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app will be live at `http://localhost:5173`.

> Note: CORS is currently configured to allow only `http://localhost:5173` — update `backend/main.py` if you deploy the frontend elsewhere.

### Database
The backend expects the following Supabase tables: `db_dictionary`, `db_articles`, `db_nit`, `db_fi`, `user_weights`, `user_category_weights`, `user_dictionary_overrides`. Row-Level Security should restrict each `user_*` table so a user can only read/write their own rows (`auth.uid() = user_id`).

---

## Design Notes

- **Why lexicon-based, not ML/NLP?** The scoring is intentionally explainable — every score can be traced back to exactly which words triggered it, which matters for a financial tool where users need to trust and audit a signal, not just receive one.
- **Guest vs. personalized views share the same underlying data** — anonymous users see pre-computed global scores (`db_fi`), while logged-in users get scores recomputed on the fly using their own weight overrides. This keeps the personalization layer additive rather than requiring separate data pipelines.
- **Auth is split into strict and optional dependencies** (`get_current_user` vs. `get_current_user_optional`) so the same aggregation logic can power both public and personalized endpoints without duplicating code.

---
