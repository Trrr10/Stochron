"""
FI Engine — all scoring logic lives here.

Formulas:
  FI  = number of foreboding words / total words in article
  
  Daily Aggregated FI  = SUM(fi_score_i  * weight_i) / N

  Regime thresholds (applied to daily aggregated FI):
    0.00 – 0.25 → Stable
    0.25 – 0.50 → Watch
    0.50 – 0.75 → Alert
    0.75 – 1.00 → Critical
"""

from typing import Optional


# ── Regime thresholds ────────────────────────────────────────
def get_regime(fi_score: Optional[float]) -> str:
    if fi_score is None or fi_score < 0.25:
        return "Stable"
    if fi_score < 0.50:
        return "Watch"
    if fi_score < 0.75:
        return "Alert"
    return "Critical"


# ── Regime colour (used by frontend) ─────────────────────────
def get_regime_color(regime: str) -> str:
    return {
        "Stable":   "#22c55e",   # green
        "Watch":    "#eab308",   # yellow
        "Alert":    "#f97316",   # orange
        "Critical": "#ef4444",   # red
    }.get(regime, "#94a3b8")


# ── Aggregate articles into daily FI/TFI/Regime ──────────────
def aggregate_articles(articles: list[dict]) -> dict:
    """
    Given a list of article dicts (each with fi_score, weight),
    returns the daily aggregated FI, TFI, Regime, and per-article contributions.

    TFI is stored in db_articles as fi_score for now
    (Sandali/Aditya's team calculates both; we store fi_score and treat it as FI).
    When TFI column is added to the DB later, this function already handles it.
    """
    n = len(articles)
    if n == 0:
        return {
            "daily_fi":      None,
            "regime":        "Stable",
            "regime_color":  get_regime_color("Stable"),
            "article_count": 0,
            "formula":       "No articles",
        }

    fi_weighted_sum = sum(
        float(a.get("fi_score", 0)) * float(a.get("weight", 1.0))
        for a in articles
    )

    # TFI: use fi_score as proxy until separate tfi_score column exists

    daily_fi = round(fi_weighted_sum / n, 4)
    regime   = get_regime(daily_fi)

    return {
        "daily_fi":      daily_fi,
        "regime":        regime,
        "regime_color":  get_regime_color(regime),
        "article_count": n,
        "formula":       f"SUM(fi_score × weight) / {n}",
    }


# ── Per-article contribution (shown in mind map leaf nodes) ──
def article_contribution(article: dict, n: int) -> float:
    fi     = float(article.get("fi_score", 0))
    weight = float(article.get("weight", 1.0))
    return round((fi * weight) / n, 6) if n > 0 else 0.0


# ── Correlation helper for Final Analysis page ────────────────
def compute_correlation(
    nit_map: dict[str, float],
    fi_map:  dict[str, float],
) -> float:
    """
    Pearson correlation between daily_fi and nifty_it
    for dates present in both maps.
    Returns value between -1 and 1, or None if insufficient data.
    """
    common_dates = sorted(set(nit_map) & set(fi_map))
    n = len(common_dates)
    if n < 2:
        return None

    xs = [fi_map[d]  for d in common_dates]
    ys = [nit_map[d] for d in common_dates]

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    cov  = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    std_x = (sum((x - mean_x) ** 2 for x in xs) ** 0.5)
    std_y = (sum((y - mean_y) ** 2 for y in ys) ** 0.5)

    if std_x == 0 or std_y == 0:
        return None

    return round(cov / (std_x * std_y), 4)