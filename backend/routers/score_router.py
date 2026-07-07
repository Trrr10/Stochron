"""
POST /score            → score ONE document against the user's active dictionary
POST /score/aggregate   → combine already-scored categories into a Final Score

"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from core.supabase import supabase
from core.auth import get_current_user
from core.fi_engine import score_document, aggregate_categories

router = APIRouter(prefix="/score", tags=["Scoring"])

CATEGORIES = ["earnings_call", "filings", "regulatory", "news"]
DEFAULT_WEIGHT = 0.25


def _get_active_words(user_id: str | None) -> tuple[set[str], set[str]]:
    words = supabase.table("db_dictionary").select("id, name, word").execute().data
    hidden_ids = set()
    if user_id:
        overrides = (
            supabase.table("user_dictionary_overrides")
            .select("word_id")
            .eq("user_id", user_id)
            .eq("hidden", True)
            .execute()
            .data
        )
        hidden_ids = {row["word_id"] for row in overrides}
    assurance = {w["word"].lower() for w in words if w["name"] == "assurance" and w["id"] not in hidden_ids}
    foreboding = {w["word"].lower() for w in words if w["name"] == "foreboding" and w["id"] not in hidden_ids}
    return assurance, foreboding

# ── Score a single document ───────────────────────────────────
class ScoreRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Pasted/uploaded document text"
    )

    category: str = Field(
        ...,
        description="earnings_call | filings | regulatory | news"
    )

@router.post("")
def score_text(body: ScoreRequest, user_id: str = Depends(get_current_user)):
    if body.category not in CATEGORIES:
        raise HTTPException(400, f"category must be one of {CATEGORIES}")
    active_assurance, active_foreboding = _get_active_words(user_id)
    result = score_document(body.text, active_assurance, active_foreboding)
    result["category"] = body.category
    return result

# ── Combine categories into a Final Score ─────────────────────
class CategoryInput(BaseModel):
    fi_score: float = Field(..., ge=0, le=1)


class AggregateRequest(BaseModel):
    categories: dict[str, CategoryInput] = Field(
        ...,
        description="Only include categories that actually have a scored document"
    )

@router.post("/aggregate")
def aggregate(body: AggregateRequest, user_id: str = Depends(get_current_user)):
    for cat in body.categories:
        if cat not in CATEGORIES:
            raise HTTPException(400, f"Unknown category: {cat}")

    weights = {c: DEFAULT_WEIGHT for c in CATEGORIES}
    rows = (
        supabase.table("user_category_weights")
        .select("category, weight")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    for r in rows:
        weights[r["category"]] = float(r["weight"])

    category_scores = {
        cat: {"fi_score": data.fi_score, "weight": weights[cat]}
        for cat, data in body.categories.items()
    }
    return aggregate_categories(category_scores)