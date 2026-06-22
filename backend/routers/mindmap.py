"""
GET /mindmap/{date}

Powers Page 2 — mind map for a specific date.

Auth: optional (same as chart).
- Logged in → articles show user's own weights + personalised FI
- Anonymous → articles show default weight 1.0 + global FI
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from core.supabase import supabase
from core.fi_engine import aggregate_articles, article_contribution
from models.schemas import MindMapResponse, ArticleOut

router = APIRouter(prefix="/mindmap", tags=["Mind Map"])


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


@router.get("/{date}", response_model=MindMapResponse)
def get_mindmap(
    date: str,
    authorization: Optional[str] = Header(None),
):
    user_id = _get_user_id_optional(authorization)

    # ── Fetch all articles for this date ──────────────────────
    res = supabase.table("db_articles") \
        .select("id, date, agency, title, ai_summary, fi_score, regime, link") \
        .eq("date", date) \
        .order("fi_score", desc=True) \
        .execute()

    if not res.data:
        raise HTTPException(404, f"No articles found for {date}")

    articles = res.data
    n        = len(articles)

    # ── Fetch user weights if logged in ───────────────────────
    if user_id:
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

    # ── Merge weights and aggregate ───────────────────────────
    merged = [
        {
            "fi_score": a["fi_score"],
            "weight":   weight_map.get(a["id"], 1.0),
        }
        for a in articles
    ]

    agg = aggregate_articles(merged)

    # ── Build leaf nodes ──────────────────────────────────────
    article_list = []
    for a in articles:
        user_weight = weight_map.get(a["id"], 1.0)
        article_list.append(ArticleOut(
            id                    = a["id"],
            date                  = a["date"],
            agency                = a.get("agency"),
            title                 = a["title"],
            ai_summary            = a.get("ai_summary"),
            fi_score              = float(a["fi_score"]),
            regime                = a.get("regime"),
            link                  = a.get("link"),
            weight                = user_weight,
            weighted_contribution = article_contribution(
                {"fi_score": a["fi_score"], "weight": user_weight}, n
            ),
        ))

    return MindMapResponse(
        date          = date,
        daily_fi      = agg["daily_fi"],
        regime        = agg["regime"],
        regime_color  = agg["regime_color"],
        article_count = agg["article_count"],
        formula       = agg["formula"],
        articles      = article_list,
    )