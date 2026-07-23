from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import chart, mindmap, articles, dictionary, analysis,score_router

app = FastAPI(
    title="Foreboding Index API",
    description="Backend for Stochron Technologies FI Platform",
    version="1.0.0",
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(chart.router)
app.include_router(mindmap.router)
app.include_router(articles.router)
app.include_router(dictionary.router)
app.include_router(analysis.router)
app.include_router(score_router.router)


# ── Health check ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "docs":   "/docs",
        "endpoints": [
            "GET  /chart-data",
            "GET  /mindmap/{date}",
            "PATCH /articles/{id}/weight",
            "GET  /dictionary",
            "POST /dictionary/{name}",
            "DELETE /dictionary/{name}/{word}",
            "GET  /analysis",
        ]
    }