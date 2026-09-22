from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_health_reports_loaded_gate():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["modelVersion"].startswith("pakistan-content-")


def test_interest_and_weather_affect_ranking():
    response = client.post("/recommend", json={
        "interests": ["Nature"],
        "context": {"weather": "clear", "budget": 75000},
        "topK": 2,
        "candidates": [
            {"title": "City Museum", "summary": "An indoor heritage collection"},
            {"title": "Mountain Lake", "summary": "A scenic lake and hiking trail", "latitude": 35.1, "longitude": 74.2},
            {"title": "Central Bazaar", "summary": "A shopping market"},
        ],
    })
    assert response.status_code == 200
    body = response.json()
    assert body["recommendations"][0]["title"] == "Mountain Lake"
    assert body["recommendations"][0]["score"] > body["recommendations"][1]["score"]


def test_request_limits_are_validated():
    response = client.post("/recommend", json={"candidates": [], "topK": 99})
    assert response.status_code == 422
