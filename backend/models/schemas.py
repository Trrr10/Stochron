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


# ── Dictionary (word list, unchanged legacy) ───────────────────

class DictionaryWord(BaseModel):
    word: str = Field(..., min_length=1)


# ── Dictionary — per-user hide/show (NEW) ──────────────────────

class DictionaryEntry(BaseModel):
    id: int
    word: str
    active: bool  # false = user has hidden this word


class DictionaryOut(BaseModel):
    assurance: list[DictionaryEntry]
    foreboding: list[DictionaryEntry]


class HideWordResponse(BaseModel):
    word_id: int
    active: bool


# ── Category weights (NEW) ─────────────────────────────────────

class WeightsOut(BaseModel):
    earnings_call: float
    filings: float
    regulatory: float
    news: float


class WeightsUpdate(BaseModel):
    weights: dict[str, float] = Field(
        ..., description="e.g. {'earnings_call': 0.4, 'filings': 0.2, 'regulatory': 0.2, 'news': 0.2}"
    )


# ── Document scoring (NEW) ──────────────────────────────────────

class ScoreRequest(BaseModel):
    text: str = Field(..., min_length=1)
    category: str = Field(..., description="earnings_call | filings | regulatory | news")


class ScoreResponse(BaseModel):
    fi_score: float
    tfi_score: float
    regime: str
    regime_color: str
    assurance_count: int
    foreboding_count: int
    total_word_count: int
    assurance_hits: list[str]
    foreboding_hits: list[str]
    category: str


class CategoryInput(BaseModel):
    fi_score: float = Field(..., ge=0, le=1)


class AggregateRequest(BaseModel):
    categories: dict[str, CategoryInput]


class AggregateResponse(BaseModel):
    final_score: Optional[float]
    regime: str
    regime_color: str
    categories_used: list[str]
    normalized_weights: dict[str, float]


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