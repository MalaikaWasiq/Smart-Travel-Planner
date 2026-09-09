# Recommendation Service

This folder contains the reproducible attraction-ranking research and the private FastAPI inference service.

## Data policy

- `data/raw/*.xlsx` is the real Huda tourism benchmark, DOI `10.17632/h58s544674.1`, CC BY 4.0.
- It contains 52,930 historical transactions for 30 Indonesian attractions. It is used only to compare ranking algorithms.
- `data/processed/pakistan_attractions.csv` contains real Pakistani attraction names and metadata used by the app's cold-start ranker.
- `data/processed/semi_synthetic_interactions.csv` is generated, versioned, and labeled `dataOrigin=semi_synthetic`. It is never used as the real benchmark test set.

## Reproduce

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ml\requirements.txt
.\.venv\Scripts\python.exe ml\train.py
.\.venv\Scripts\python.exe -m pytest ml
.\scripts\start-ml.ps1
```

`train.py` verifies source checksums, uses a chronological per-user holdout, compares four baselines, exports metrics and a model card, and builds the Pakistan cold-start artifact. The API exposes `GET /health` and `POST /recommend`.

The benchmark model and production fallback are intentionally separate because an Indonesian 30-item model cannot score unseen Pakistani attraction IDs. Known app users can later move to collaborative ranking after enough consented local interactions exist.

The fresh-PC bootstrap and all project launch/test scripts prefer the repository `.venv` so results do not depend on globally installed Python packages. See `AGENT_SETUP.md` at the repository root for the complete autonomous setup contract.
