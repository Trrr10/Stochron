"""
PATCH /articles/{article_id}/weight

Protected endpoint — requires valid Supabase JWT.

Flow:
  1. Validate JWT → get user_id
  2. Verify article exists → get its date
  3. Upsert into user_weights (not db_articles anymore)
  4. Recalculate daily FI for this user on the fly
  5. Return new_daily_fi so both frontend pages update instantly
"""

from fastapi import APIRouter, HTTPException, Depends
from core.supabase import supabase
from core.auth import get_current_user
from core.fi_engine import aggregate_articles, get_regime
from models.schemas import WeightUpdate, WeightUpdateResponse

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.patch("/{article_id}/weight", response_model=WeightUpdateResponse)
def update_weight(
    article_id: int,
    body: WeightUpdate,
    user_id: str = Depends(get_current_user),   # JWT required
):
    """
    Upserts a weight into user_weights for this user + article.
    Then recalculates the daily FI for this user for that date
    by fetching all articles for the date and merging with user's weights.
    """

    # ── 1. Verify article exists and get its date ─────────────
    fetch = supabase.table("db_articles") \
        .select("id, date") \
        .eq("id", article_id) \
        .single() \
        .execute()

    if not fetch.data:
        raise HTTPException(404, f"Article {article_id} not found")

    date = fetch.data["date"]

    # ── 2. Upsert into user_weights ───────────────────────────
    # ON CONFLICT (user_id, article_id) → update weight
    # This is safe: user can only upsert rows where user_id = their own id
    # because RLS policy enforces auth.uid() = user_id
    supabase.table("user_weights").upsert({
        "user_id":    user_id,
        "article_id": article_id,
        "weight":     body.weight,
    }, on_conflict="user_id,article_id").execute()

    # ── 3. Fetch all articles for that date ───────────────────
    articles_res = supabase.table("db_articles") \
        .select("id, fi_score") \
        .eq("date", date) \
        .execute()

    articles = articles_res.data or []

    # ── 4. Fetch this user's weights for these articles ───────
    article_ids = [a["id"] for a in articles]
    weights_res = supabase.table("user_weights") \
        .select("article_id, weight") \
        .eq("user_id", user_id) \
        .in_("article_id", article_ids) \
        .execute()

    # Build weight lookup: article_id → weight (default 1.0 if not set)
    weight_map = {
        row["article_id"]: float(row["weight"])
        for row in (weights_res.data or [])
    }

    # Merge weights into articles
    merged = [
        {
            "fi_score": a["fi_score"],
            "weight":   weight_map.get(a["id"], 1.0),
        }
        for a in articles
    ]

    # ── 5. Aggregate FI for this user for this date ───────────
    agg          = aggregate_articles(merged)
    new_daily_fi = agg["daily_fi"]
    new_regime   = agg["regime"]

    return WeightUpdateResponse(
        article_id   = article_id,
        date         = date,
        new_weight   = body.weight,
        new_daily_fi = new_daily_fi,
        new_regime   = new_regime,
        message      = (
            f"Weight updated to {body.weight}. "
            f"Your daily FI for {date} is now {new_daily_fi} ({new_regime})"
        ),
    )