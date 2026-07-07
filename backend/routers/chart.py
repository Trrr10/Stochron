from fastapi import APIRouter, Query, Header
from typing import Optional
from core.supabase import supabase
from core.fi_engine import get_regime, get_regime_color, aggregate_articles
from models.schemas import ChartResponse, ChartPoint

router = APIRouter(prefix="/chart-data", tags=["Chart"])


def _get_user_id_optional(authorization: Optional[str]) -> Optional[str]:
    """
    Tries to extract user_id from JWT without raising an error if missing.
    Chart works for both logged-in and anonymous users.
    """
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


@router.get("", response_model=ChartResponse)
def get_chart_data(
    from_date:     Optional[str] = Query(None),
    to_date:       Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),  # optional JWT
):
    user_id = _get_user_id_optional(authorization)

    # ── Fetch db_nit ──────────────────────────────────────────
    nit_q = supabase.table("db_nit").select("date, nifty_it").order("date")
    if from_date: nit_q = nit_q.gte("date", from_date)
    if to_date:   nit_q = nit_q.lte("date", to_date)
    nit_res = nit_q.execute()

    if not nit_res.data:
        return ChartResponse(chart_data=[], total_dates=0)

    # ── If logged in: compute personalised FI per date ────────
    if user_id:
        # Fetch all articles in range
        art_q = supabase.table("db_articles").select("id, date, fi_score")
        if from_date: art_q = art_q.gte("date", from_date)
        if to_date:   art_q = art_q.lte("date", to_date)
        art_res = art_q.execute()
        articles = art_res.data or []

        # Fetch user's weights for all these articles
        article_ids = [a["id"] for a in articles]
        if article_ids:
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

        # Group articles by date with user weights merged in
        from collections import defaultdict
        date_articles: dict = defaultdict(list)
        for a in articles:
            date_articles[a["date"]].append({
                "fi_score": a["fi_score"],
                "weight":   weight_map.get(a["id"], 1.0),
            })

        # Aggregate per date
        fi_map = {
            date: aggregate_articles(arts)["daily_fi"]
            for date, arts in date_articles.items()
        }
        count_map = {date: len(arts) for date, arts in date_articles.items()}

    else:
        # ── Anonymous: use pre-computed global db_fi ──────────
        fi_q = supabase.table("db_fi").select("date, daily_fi")
        if from_date: fi_q = fi_q.gte("date", from_date)
        if to_date:   fi_q = fi_q.lte("date", to_date)
        fi_res = fi_q.execute()

        fi_map    = {r["date"]: float(r["daily_fi"]) for r in (fi_res.data or [])}
        count_map = {}

    # ── Merge and build response ──────────────────────────────
    chart_data = []
    for row in nit_res.data:
        date     = row["date"]
        daily_fi = fi_map.get(date)
        regime   = get_regime(daily_fi) if daily_fi is not None else None

        chart_data.append(ChartPoint(
            date          = date,
            nifty_it      = float(row["nifty_it"]),
            daily_fi      = daily_fi,
            regime        = regime,
            regime_color  = get_regime_color(regime) if regime else None,
            article_count = count_map.get(date, 0),
        ))

    return ChartResponse(chart_data=chart_data, total_dates=len(chart_data))