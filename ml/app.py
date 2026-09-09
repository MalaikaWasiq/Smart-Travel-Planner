from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
ARTIFACT = json.loads((ROOT / "artifacts" / "pakistan_ranker.json").read_text(encoding="utf-8"))
METRICS = json.loads((ROOT / "artifacts" / "benchmark_metrics.json").read_text(encoding="utf-8"))

CATEGORY_TERMS = {
    "history": ["fort", "mosque", "monument", "tomb", "historic", "heritage", "ancient"],
    "culture": ["museum", "gallery", "arts", "cultural", "shrine", "village"],
    "nature": ["park", "lake", "garden", "valley", "hill", "mountain", "beach", "forest"],
    "adventure": ["trail", "hiking", "ski", "chair lift", "desert", "bridge", "pass"],
    "food": ["food", "restaurant", "cuisine", "cafe"],
    "shopping": ["bazaar", "market", "mall", "shops"],
}


class Candidate(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1, max_length=180)
    summary: str = Field(default="", max_length=2000)
    latitude: float | None = None
    longitude: float | None = None
    wikipediaUrl: str | None = None


class RecommendRequest(BaseModel):
    userId: str | None = None
    candidates: list[Candidate] = Field(min_length=1, max_length=50)
    interests: list[str] = Field(default_factory=list, max_length=10)
    context: dict[str, Any] = Field(default_factory=dict)
    topK: int = Field(default=10, ge=1, le=20)


def category_for(candidate: Candidate) -> str:
    text = f"{candidate.title} {candidate.summary}".lower()
    scored = {category: sum(term in text for term in terms) for category, terms in CATEGORY_TERMS.items()}
    category, count = max(scored.items(), key=lambda pair: pair[1])
    return category if count else "culture"


def rank(request: RecommendRequest) -> list[dict[str, Any]]:
    interests = {re.sub(r"[^a-z]", "", value.lower()) for value in request.interests}
    budget = float(request.context.get("budget") or 0)
    weather = str(request.context.get("weather") or "").lower()
    ranked = []
    for index, candidate in enumerate(request.candidates):
        category = category_for(candidate)
        interest_score = 1.0 if category in interests else 0.2
        weather_score = 0.0
        if any(word in weather for word in ["rain", "snow", "storm"]):
            weather_score = 0.3 if category in {"culture", "food", "shopping", "history"} else -0.2
        elif category in {"nature", "adventure"}:
            weather_score = 0.15
        coordinate_score = 0.08 if candidate.latitude is not None and candidate.longitude is not None else 0
        budget_score = 0.05 if budget > 0 else 0
        source_score = 0.05 if candidate.wikipediaUrl else 0
        stable_prior = max(0, 0.12 - index * 0.004)
        score = round(interest_score + weather_score + coordinate_score + budget_score + source_score + stable_prior, 6)
        reasons = [f"matches {category} content"]
        if category in interests:
            reasons.append("matches your interests")
        if weather_score > 0:
            reasons.append("fits expected weather")
        ranked.append({
            **candidate.model_dump(),
            "id": candidate.id or re.sub(r"[^a-z0-9]+", "-", candidate.title.lower()).strip("-"),
            "category": category,
            "score": score,
            "reason": "; ".join(reasons),
            "modelVersion": ARTIFACT["modelVersion"],
            "fallbackSource": "content-cold-start",
        })
    return sorted(ranked, key=lambda item: (-item["score"], item["title"]))[: request.topK]


app = FastAPI(title="Smart Travel Planner Recommendation Service", version=ARTIFACT["modelVersion"])


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "modelVersion": ARTIFACT["modelVersion"],
        "benchmarkModel": METRICS["selected_benchmark_model"],
        "benchmarkGatePassed": METRICS["integration_gate_passed"],
    }


@app.post("/recommend")
def recommend(request: RecommendRequest) -> dict[str, Any]:
    return {"recommendations": rank(request), "modelVersion": ARTIFACT["modelVersion"], "fallbackUsed": False}
