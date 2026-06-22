from pydantic import BaseModel, Field
from typing import Optional


# ── Articles ──────────────────────────────────────────────────

class WeightUpdate(BaseModel):
    weight: float = Field(..., ge=0.0, le=1.0, description="New weight for the article (0.0 to 1.0)")


class ArticleOut(BaseModel):
    id: int
    date: str
    agency: Optional[str]
    title: str
    ai_summary: Optional[str]
    fi_score: float
    regime: Optional[str]
    link: Optional[str]
    weight: float
    weighted_contribution: Optional[float] = None


# ── Chart (Page 1) ────────────────────────────────────────────

class ChartPoint(BaseModel):
    date: str
    nifty_it: Optional[float]
    daily_fi: Optional[float]
    regime: Optional[str]
    regime_color: Optional[str]
    article_count: Optional[int]


class ChartResponse(BaseModel):
    chart_data: list[ChartPoint]
    total_dates: int


# ── Mind Map (Page 2) ─────────────────────────────────────────

class MindMapResponse(BaseModel):
    date: str
    daily_fi: Optional[float]
    regime: str
    regime_color: str
    article_count: int
    formula: str
    articles: list[ArticleOut]


# ── Weight update response ────────────────────────────────────

class WeightUpdateResponse(BaseModel):
    article_id: int
    date: str
    new_weight: float
    new_daily_fi: Optional[float]
    new_regime: str
    message: str


# ── Dictionary ───────────────────────────────────────────────

class DictionaryWord(BaseModel):
    word: str = Field(..., min_length=1)


class DictionaryOut(BaseModel):
    rootForeboding: list[str]
    foreboding: list[str]
    assurance: list[str]
    geopolitical: list[str]


# ── Final Analysis (Page 3) ───────────────────────────────────

class RegimeStat(BaseModel):
    regime: str
    count: int
    avg_fi: float
    color: str


class AnalysisResponse(BaseModel):
    correlation_coefficient: Optional[float]
    interpretation: str
    time_series: list[ChartPoint]
    regime_breakdown: list[RegimeStat]
    total_articles: int
    date_range: dict