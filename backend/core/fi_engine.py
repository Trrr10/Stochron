"""
FI Engine — all scoring logic lives here.

  FI  = Foreboding_Count / (Foreboding_Count + Assurance_Count)
        Ranges 0 (all assurance) to 1 (all foreboding).
        Returns 0.0 if neither word type is found (no signal, not "critical").

  TFI = Foreboding_Count / Total_Word_Count
        If the user hides a foreboding word, it no longer counts here either.

  Category weighting (cross-category combination for a single upload session):
      Final_Score = SUM(category_fi_i * category_weight_i) for every
      category that HAS a document. Categories with no document contribute
      nothing (they are excluded from both numerator and the weight sum
      normalization — see aggregate_categories()).
      Default weight per category = 0.25, fully user-editable.

  Regime thresholds (applied to any 0-1 score — FI, TFI, or Final_Score):
    0.00 – 0.25 → Stable
    0.25 – 0.50 → Watch
    0.50 – 0.75 → Alert
    0.75 – 1.00 → Critical

"""

import re
from typing import Optional


# ── Tokenization ──────────────────────────────────────────────
def tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation/numbers, split into words."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    return [w for w in text.split() if w]


# ── Regime thresholds ────────────────────────────────────────
def get_regime(score: Optional[float]) -> str:
    if score is None or score < 0.25:
        return "Stable"
    if score < 0.50:
        return "Watch"
    if score < 0.75:
        return "Alert"
    return "Critical"


def get_regime_color(regime: str) -> str:
    return {
        "Stable":   "#22c55e",
        "Watch":    "#eab308",
        "Alert":    "#f97316",
        "Critical": "#ef4444",
    }.get(regime, "#94a3b8")


# ── Core document scoring (NEW pipeline) ─────────────────────
def score_document(
    text: str,
    active_assurance: set[str],
    active_foreboding: set[str],
) -> dict:
    """
    Score a single pasted/uploaded document against the user's CURRENT
    active word sets (i.e. after they've hidden whatever they don't want
    counted). Both active_assurance and active_foreboding should already
    be lowercase.

    """
    tokens = tokenize(text)
    total_words = len(tokens)

    assurance_hits = [t for t in tokens if t in active_assurance]
    foreboding_hits = [t for t in tokens if t in active_foreboding]

    a_count = len(assurance_hits)
    f_count = len(foreboding_hits)
    sentiment_total = a_count + f_count

    fi = round(f_count / sentiment_total, 4) if sentiment_total > 0 else 0.0
    tfi = round(f_count / total_words, 4) if total_words > 0 else 0.0

    regime = get_regime(fi)

    return {
        "fi_score": fi,
        "tfi_score": tfi,
        "regime": regime,
        "regime_color": get_regime_color(regime),
        "assurance_count": a_count,
        "foreboding_count": f_count,
        "total_word_count": total_words,
        "assurance_hits": sorted(set(assurance_hits)),
        "foreboding_hits": sorted(set(foreboding_hits)),
    }


# ── Cross-category aggregation (NEW pipeline) ────────────────
def aggregate_categories(category_scores: dict[str, dict]) -> dict:
    """
    Combine per-category FI scores into one Final Score using per-category
    weights. Only categories that actually have a scored document
    participate — both in the weighted sum AND in the weight normalization,
    so an empty category never silently drags the score toward 0.

    Returns Final_Score, regime, and the normalized weights actually used.
    """
    active = {k: v for k, v in category_scores.items() if v.get("fi_score") is not None}

    if not active:
        return {
            "final_score": None,
            "regime": "Stable",
            "regime_color": get_regime_color("Stable"),
            "categories_used": [],
            "normalized_weights": {},
        }

    weight_sum = sum(v["weight"] for v in active.values())
    if weight_sum == 0:
        # Degenerate case: all active categories weighted to 0 by the user.
        # Fall back to an unweighted average so we don't divide by zero.
        normalized = {k: 1 / len(active) for k in active}
    else:
        normalized = {k: v["weight"] / weight_sum for k, v in active.items()}

    final_score = sum(active[k]["fi_score"] * normalized[k] for k in active)
    final_score = round(final_score, 4)
    regime = get_regime(final_score)

    return {
        "final_score": final_score,
        "regime": regime,
        "regime_color": get_regime_color(regime),
        "categories_used": list(active.keys()),
        "normalized_weights": {k: round(v, 4) for k, v in normalized.items()},
    }

def aggregate_articles(articles: list[dict]) -> dict:
    n = len(articles)
    if n == 0:
        return {
            "daily_fi": None,
            "regime": "Stable",
            "regime_color": get_regime_color("Stable"),
            "article_count": 0,
            "formula": "No articles",
        }

    fi_weighted_sum = sum(
        float(a.get("fi_score", 0)) * float(a.get("weight", 1.0))
        for a in articles
    )

    daily_fi = round(fi_weighted_sum / n, 4)
    regime = get_regime(daily_fi)

    return {
        "daily_fi": daily_fi,
        "regime": regime,
        "regime_color": get_regime_color(regime),
        "article_count": n,
        "formula": f"SUM(fi_score × weight) / {n}",
    }


def article_contribution(article: dict, n: int) -> float:
    fi = float(article.get("fi_score", 0))
    weight = float(article.get("weight", 1.0))
    return round((fi * weight) / n, 6) if n > 0 else 0.0


def compute_correlation(nit_map: dict[str, float], fi_map: dict[str, float]) -> Optional[float]:
    common_dates = sorted(set(nit_map) & set(fi_map))
    n = len(common_dates)
    if n < 2:
        return None

    xs = [fi_map[d] for d in common_dates]
    ys = [nit_map[d] for d in common_dates]

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    std_x = sum((x - mean_x) ** 2 for x in xs) ** 0.5
    std_y = sum((y - mean_y) ** 2 for y in ys) ** 0.5

    if std_x == 0 or std_y == 0:
        return None

    return round(cov / (std_x * std_y), 4)