"""
GET /analysis

Powers Page 3 — Final Analysis.

Auth: optional.
- Logged in → correlation computed using user's personalised weights
- Anonymous → correlation computed using global default weights (all 1.0)
"""

from fastapi import APIRouter, Query, Header
from typing import Optional
from collections import defaultdict
from core.supabase import supabase
from core.fi_engine import get_regime, get_regime_color, compute_correlation, aggregate_articles
from models.schemas import AnalysisResponse, ChartPoint, RegimeStat

router = APIRouter(prefix="/analysis", tags=["Analysis"])

REGIME_COLORS = {
    "Stable":   "#22c55e",
    "Watch":    "#eab308",
    "Alert":    "#f97316",
    "Critical": "#ef4444",
}


def _get_user_id_optional(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.replace("Bearer ", "").strip()
        response = supabase.auth.get_user(token)
        if response and response.user:
            return str(response.user.id)
    except Exception:
        pass
    return None


@router.get("", response_model=AnalysisResponse)
def get_analysis(
    from_date:     Optional[str] = Query(None),
    to_date:       Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    user_id = _get_user_id_optional(authorization)

    # ── Fetch db_nit ──────────────────────────────────────────
    nit_q = supabase.table("db_nit").select("date, nifty_it").order("date")
    if from_date: nit_q = nit_q.gte("date", from_date)
    if to_date:   nit_q = nit_q.lte("date", to_date)
    nit_res = nit_q.execute()
    nit_map = {r["date"]: float(r["nifty_it"]) for r in (nit_res.data or [])}

    # ── Fetch articles ────────────────────────────────────────
    art_q = supabase.table("db_articles").select("id, date, fi_score, regime")
    if from_date: art_q = art_q.gte("date", from_date)
    if to_date:   art_q = art_q.lte("date", to_date)
    art_res  = art_q.execute()
    articles = art_res.data or []

    # ── Resolve weights ───────────────────────────────────────
    if user_id and articles:
        article_ids = [a["id"] for a in articles]
        w_res = supabase.table("user_weights") \
            .select("article_id, weight") \
            .eq("user_id", user_id) \
            .in_("article_id", article_ids) \
            .execute()
        weight_map = {
            r["article_id"]: float(r["weight"])
            for r in (w_res.data or [])
        }
    else:
        weight_map = {}

    # ── Compute per-date FI using resolved weights ────────────
    date_articles: dict = defaultdict(list)
    for a in articles:
        date_articles[a["date"]].append({
            "fi_score": a["fi_score"],
            "weight":   weight_map.get(a["id"], 1.0),
        })

    fi_map = {
        date: aggregate_articles(arts)["daily_fi"]
        for date, arts in date_articles.items()
    }

    # ── Time series ───────────────────────────────────────────
    time_series = []
    for row in (nit_res.data or []):
        date     = row["date"]
        daily_fi = fi_map.get(date)
        regime   = get_regime(daily_fi) if daily_fi is not None else None
        time_series.append(ChartPoint(
            date          = date,
            nifty_it      = float(row["nifty_it"]),
            daily_fi      = daily_fi,
            regime        = regime,
            regime_color  = get_regime_color(regime) if regime else None,
            article_count = None,
        ))

    # ── Regime breakdown ──────────────────────────────────────
    regime_buckets: dict = {k: [] for k in REGIME_COLORS}
    for a in articles:
        fi     = float(a["fi_score"])
        regime = a.get("regime") or get_regime(fi)
        if regime in regime_buckets:
            regime_buckets[regime].append(fi)

    regime_breakdown = [
        RegimeStat(
            regime  = regime,
            count   = len(scores),
            avg_fi  = round(sum(scores) / len(scores), 4) if scores else 0.0,
            color   = REGIME_COLORS[regime],
        )
        for regime, scores in regime_buckets.items()
    ]

    # ── Correlation ───────────────────────────────────────────
    corr = compute_correlation(nit_map, fi_map)

    if corr is None:
        interpretation = "Insufficient data to compute correlation"
    elif corr < -0.7:
        interpretation = f"Strong negative correlation ({corr}): As FI rises, NIFTY IT falls — model is working."
    elif corr < -0.4:
        interpretation = f"Moderate negative correlation ({corr}): FI shows some predictive power."
    elif corr < 0:
        interpretation = f"Weak negative correlation ({corr}): Limited predictive signal in this range."
    else:
        interpretation = f"Positive or no correlation ({corr}): FI may not be predictive for this period."

    all_dates  = sorted(nit_map.keys())
    date_range = {
        "from": all_dates[0]  if all_dates else None,
        "to":   all_dates[-1] if all_dates else None,
    }

    return AnalysisResponse(
        correlation_coefficient = corr,
        interpretation          = interpretation,
        time_series             = time_series,
        regime_breakdown        = regime_breakdown,
        total_articles          = len(articles),
        date_range              = date_range,
    )