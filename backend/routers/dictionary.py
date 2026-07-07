"""
GET  /dictionary                        → all words + which are hidden for this user
POST /dictionary/{name}                 → add a new global word (unchanged from before)
PATCH /dictionary/{word_id}/hide        → hide this word for the current user
PATCH /dictionary/{word_id}/unhide      → restore this word for the current user
GET  /dictionary/weights                → this user's category weights (defaults to 0.25 each)
PUT  /dictionary/weights                → update this user's category weights
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from core.supabase import supabase
from core.auth import get_current_user  # existing JWT dependency
from core.auth import get_current_user_optional


router = APIRouter(prefix="/dictionary", tags=["Dictionary"])

DEFAULT_WEIGHT = 0.25
CATEGORIES = ["earnings_call", "filings", "regulatory", "news"]


# ── Get full dictionary + this user's hidden words ───────────
@router.get("")
def get_dictionary(user_id: str | None = Depends(get_current_user_optional)):
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

    assurance, foreboding = [], []
    for w in words:
        entry = {"id": w["id"], "word": w["word"], "active": w["id"] not in hidden_ids}
        (assurance if w["name"] == "assurance" else foreboding).append(entry)

    return {"assurance": assurance, "foreboding": foreboding}


@router.patch("/{word_id}/hide")
def hide_word(word_id: int, user_id: str = Depends(get_current_user)):
    supabase.table("user_dictionary_overrides").upsert({
        "user_id": user_id,
        "word_id": word_id,
        "hidden": True,
    }, on_conflict="user_id,word_id").execute()
    return {"word_id": word_id, "active": False}


@router.patch("/{word_id}/unhide")
def unhide_word(word_id: int, user_id: str = Depends(get_current_user)):
    supabase.table("user_dictionary_overrides").delete() \
        .eq("user_id", user_id).eq("word_id", word_id).execute()
    return {"word_id": word_id, "active": True}

# ── Request body for updating category weights ────────────────
class WeightsUpdate(BaseModel):
    weights: dict[str, float] = Field(
        ...,
        description="Category weights for earnings_call, filings, regulatory and news"
    )

@router.get("/weights")
def get_weights(user_id: str = Depends(get_current_user)):
    result = {c: DEFAULT_WEIGHT for c in CATEGORIES}
    rows = (
        supabase.table("user_category_weights")
        .select("category, weight")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    for r in rows:
        result[r["category"]] = float(r["weight"])
    return result


@router.put("/weights")
def update_weights(body: WeightsUpdate, user_id: str = Depends(get_current_user)):
    for category, weight in body.weights.items():
        if category not in CATEGORIES:
            raise HTTPException(400, f"Unknown category: {category}")
        if not (0 <= weight <= 1):
            raise HTTPException(400, f"Weight for {category} must be between 0 and 1")
        supabase.table("user_category_weights").upsert({
            "user_id": user_id,
            "category": category,
            "weight": weight,
        }, on_conflict="user_id,category").execute()
    return get_weights(user_id)