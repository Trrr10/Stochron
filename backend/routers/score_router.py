"""
POST /score

Scores a piece of text against one of the 4 dictionaries.
Called by the frontend when a user adds a new document to a category.

Request body:
  { "text": "...", "dictionary": "D1" }

Response:
  {
    "fi_score": 0.642,
    "regime": "Alert",
    "dictionary_used": "D1",
    "positive_hits": ["growth", "profit"],
    "negative_hits": ["decline", "crash", "fall"],
    "total_words_checked": 5
  }
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from core.fi_engine import compute_fi_score, get_regime, DICTIONARIES

router = APIRouter(prefix="/score", tags=["Scoring"])


class ScoreRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Document text to score")
    dictionary: str = Field("D1", description="D1 | D2 | D3 | D4")


@router.post("", summary="Score text against a dictionary")
def score_text(body: ScoreRequest):
    """
    Runs the dictionary-based FI scoring algorithm on the provided text.
    Used when a user adds a new document via the frontend Add Document dialog.

    The FI score reflects how many negative/foreboding words appear
    relative to positive/assurance words, weighted by the chosen dictionary.
    """
    if body.dictionary not in DICTIONARIES:
        body.dictionary = "D1"

    text_lower = body.text.lower()
    d = DICTIONARIES[body.dictionary]

    positive_hits = [p for p in d["positive"] if p in text_lower]
    negative_hits = [n for n in d["negative"] if n in text_lower]

    fi_score = compute_fi_score(body.text, body.dictionary)
    regime   = get_regime(fi_score)

    return {
        "fi_score":           fi_score,
        "regime":             regime,
        "dictionary_used":    body.dictionary,
        "positive_hits":      positive_hits,
        "negative_hits":      negative_hits,
        "total_words_checked": len(positive_hits) + len(negative_hits),
    }