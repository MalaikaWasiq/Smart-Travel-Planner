from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
ARTIFACTS = ROOT / "artifacts"
SEED = 20260810
TOP_K = 10
SOURCE_CHECKSUMS = {
    "Item.xlsx": "3cfbd728c8660e8706788f29261865f490cdd144b2605ec2ef997c540bcd5c96",
    "Transaction.xlsx": "cf4d4f49402d952844ee0b22b26b34cd3a98f45020310beedb6bb9acd52c99cf",
    "Type.xlsx": "3e1888d2df75192173bdec355fe3d42d69324bcc976808867b0990dee57d090b",
    "User.xlsx": "5aebe6b97555657c24a27e99da00f2609389f86d62fdff60381ceb7d0f1c9331",
}

PAKISTAN_ATTRACTIONS = [
    ("lahore-fort", "Lahore Fort", "Lahore", "history", 800),
    ("badshahi-mosque", "Badshahi Mosque", "Lahore", "history", 200),
    ("lahore-museum", "Lahore Museum", "Lahore", "culture", 500),
    ("shalimar-gardens", "Shalimar Gardens", "Lahore", "nature", 500),
    ("anarkali-bazaar", "Anarkali Bazaar", "Lahore", "shopping", 0),
    ("faisal-mosque", "Faisal Mosque", "Islamabad", "history", 0),
    ("pakistan-monument", "Pakistan Monument", "Islamabad", "culture", 500),
    ("lok-virsa", "Lok Virsa Museum", "Islamabad", "culture", 500),
    ("margalla-hills", "Margalla Hills", "Islamabad", "nature", 0),
    ("rawal-lake", "Rawal Lake", "Islamabad", "nature", 300),
    ("mohatta-palace", "Mohatta Palace", "Karachi", "culture", 500),
    ("mazar-e-quaid", "Quaid-e-Azam Mausoleum", "Karachi", "history", 0),
    ("clifton-beach", "Clifton Beach", "Karachi", "nature", 0),
    ("frere-hall", "Frere Hall", "Karachi", "history", 0),
    ("burns-road", "Burns Road Food Street", "Karachi", "food", 1800),
    ("baltit-fort", "Baltit Fort", "Hunza", "history", 1200),
    ("altit-fort", "Altit Fort", "Hunza", "history", 1000),
    ("attabad-lake", "Attabad Lake", "Hunza", "nature", 1500),
    ("passu-cones", "Passu Cones", "Hunza", "adventure", 500),
    ("karimabad-bazaar", "Karimabad Bazaar", "Hunza", "shopping", 0),
    ("shigar-fort", "Shigar Fort", "Skardu", "history", 1200),
    ("upper-kachura", "Upper Kachura Lake", "Skardu", "nature", 800),
    ("satpara-lake", "Satpara Lake", "Skardu", "nature", 500),
    ("cold-desert", "Sarfaranga Cold Desert", "Skardu", "adventure", 1200),
    ("mall-road", "Mall Road", "Murree", "shopping", 0),
    ("patriata", "Patriata Chair Lift", "Murree", "adventure", 2500),
    ("malam-jabba", "Malam Jabba", "Swat", "adventure", 2500),
    ("swat-museum", "Swat Museum", "Swat", "culture", 500),
    ("peshawar-museum", "Peshawar Museum", "Peshawar", "culture", 500),
    ("bala-hisar", "Bala Hisar Fort", "Peshawar", "history", 500),
]

ARCHETYPES = {
    "history": {"history": 1.0, "culture": 0.8, "food": 0.3},
    "nature": {"nature": 1.0, "adventure": 0.7, "culture": 0.2},
    "family": {"nature": 0.8, "culture": 0.7, "history": 0.5},
    "food": {"food": 1.0, "shopping": 0.6, "culture": 0.5},
    "adventure": {"adventure": 1.0, "nature": 0.8, "history": 0.2},
    "budget": {"history": 0.7, "nature": 0.8, "culture": 0.5},
    "luxury": {"food": 0.8, "shopping": 0.8, "culture": 0.6},
}


def verify_sources() -> None:
    for filename, expected in SOURCE_CHECKSUMS.items():
        path = RAW / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing {path}. Download DOI 10.17632/h58s544674.1 first.")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Checksum mismatch for {filename}: {actual}")


def load_real_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    items = pd.read_excel(RAW / "Item.xlsx").merge(pd.read_excel(RAW / "Type.xlsx"), on="AttractionTypeId", how="left")
    tx = pd.read_excel(RAW / "Transaction.xlsx")
    tx = tx.sort_values(["VisitYear", "VisitMonth", "TransactionId"]).drop_duplicates(["UserId", "AttractionId"], keep="last")
    return items, tx


def ranking_metrics(scores: np.ndarray, heldout: np.ndarray, seen: sparse.csr_matrix, item_types: np.ndarray) -> dict:
    hits = ndcg = average_precision = 0.0
    recommended = set()
    diversity = []
    for row in range(scores.shape[0]):
        row_scores = scores[row].copy()
        row_scores[seen[row].indices] = -np.inf
        ranking = np.argpartition(-row_scores, min(TOP_K, len(row_scores)) - 1)[:TOP_K]
        ranking = ranking[np.argsort(-row_scores[ranking])]
        recommended.update(ranking.tolist())
        diversity.append(len(set(item_types[ranking].tolist())) / max(1, min(TOP_K, len(set(item_types.tolist())))))
        positions = np.where(ranking == heldout[row])[0]
        if positions.size:
            hits += 1
            rank = int(positions[0]) + 1
            ndcg += 1 / math.log2(rank + 1)
            average_precision += 1 / rank
    users = max(1, scores.shape[0])
    return {
        "users": int(scores.shape[0]),
        "recall_at_10": round(hits / users, 6),
        "precision_at_10": round(hits / users / TOP_K, 6),
        "ndcg_at_10": round(ndcg / users, 6),
        "map_at_10": round(average_precision / users, 6),
        "hit_rate_at_10": round(hits / users, 6),
        "catalog_coverage": round(len(recommended) / scores.shape[1], 6),
        "type_diversity": round(float(np.mean(diversity)), 6),
    }


def benchmark(items: pd.DataFrame, tx: pd.DataFrame) -> dict:
    item_ids = items.AttractionId.tolist()
    item_index = {item_id: index for index, item_id in enumerate(item_ids)}
    unique_counts = tx.groupby("UserId").AttractionId.nunique()
    eligible = set(unique_counts[unique_counts >= 2].index)
    eligible_tx = tx[tx.UserId.isin(eligible)].copy()
    test_rows = eligible_tx.groupby("UserId", sort=False).tail(1)
    train = eligible_tx.drop(test_rows.index)
    user_ids = test_rows.UserId.tolist()
    user_index = {user_id: index for index, user_id in enumerate(user_ids)}
    train = train[train.UserId.isin(user_index)]
    rows = train.UserId.map(user_index).to_numpy()
    cols = train.AttractionId.map(item_index).to_numpy()
    ratings = train.Rating.to_numpy(dtype=float)
    matrix = sparse.csr_matrix((ratings, (rows, cols)), shape=(len(user_ids), len(item_ids)))
    binary = matrix.copy()
    binary.data = np.ones_like(binary.data)
    heldout = test_rows.AttractionId.map(item_index).to_numpy()
    item_types = items.set_index("AttractionId").loc[item_ids].AttractionTypeId.to_numpy()

    counts = np.asarray(binary.sum(axis=0)).ravel()
    sums = np.asarray(matrix.sum(axis=0)).ravel()
    global_mean = float(ratings.mean())
    popularity = (sums + 8 * global_mean) / (counts + 8) + np.log1p(counts) * 0.03
    popularity_scores = np.tile(popularity, (len(user_ids), 1))

    type_values = sorted(set(item_types.tolist()))
    type_to_col = {value: index for index, value in enumerate(type_values)}
    item_features = np.zeros((len(item_ids), len(type_values)))
    for index, value in enumerate(item_types):
        item_features[index, type_to_col[value]] = 1
    user_profiles = matrix @ item_features
    profile_counts = binary @ item_features
    user_profiles = np.divide(user_profiles, np.maximum(profile_counts, 1), out=np.zeros_like(user_profiles), where=np.maximum(profile_counts, 1) != 0)
    content_scores = user_profiles @ item_features.T + popularity_scores * 0.08

    similarity = cosine_similarity(binary.T)
    np.fill_diagonal(similarity, 0)
    knn_scores = np.asarray(matrix @ similarity.T) + popularity_scores * 0.05

    components = min(12, min(matrix.shape) - 1)
    svd = TruncatedSVD(n_components=components, random_state=SEED)
    factors = svd.fit_transform(matrix)
    svd_scores = factors @ svd.components_ + popularity_scores * 0.04

    models = {
        "popularity": ranking_metrics(popularity_scores, heldout, binary, item_types),
        "content_type_profile": ranking_metrics(content_scores, heldout, binary, item_types),
        "item_knn_cosine": ranking_metrics(knn_scores, heldout, binary, item_types),
        "truncated_svd": ranking_metrics(svd_scores, heldout, binary, item_types),
    }
    candidates = [(name, metrics) for name, metrics in models.items() if name != "popularity"]
    selected_name, selected_metrics = max(candidates, key=lambda pair: (pair[1]["ndcg_at_10"], pair[1]["recall_at_10"]))
    gate_passed = selected_metrics["ndcg_at_10"] > models["popularity"]["ndcg_at_10"] and selected_metrics["recall_at_10"] >= models["popularity"]["recall_at_10"]
    return {
        "dataset": {
            "doi": "10.17632/h58s544674.1",
            "license": "CC BY 4.0",
            "raw_transactions": int(len(tx)),
            "eligible_test_users": int(len(user_ids)),
            "items": int(len(items)),
            "split": "chronological leave-last-unique-item-out per user",
            "test_origin": "real-only",
        },
        "models": models,
        "selected_benchmark_model": selected_name if gate_passed else "popularity",
        "integration_gate_passed": bool(gate_passed),
    }


def build_pakistan_artifact() -> dict:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)
    catalog = pd.DataFrame(PAKISTAN_ATTRACTIONS, columns=["attractionId", "name", "city", "type", "estimatedCost"])
    catalog["source"] = "curated_from_existing_app_and_wikipedia_names"
    catalog.to_csv(PROCESSED / "pakistan_attractions.csv", index=False)
    rows = []
    for archetype, affinities in ARCHETYPES.items():
        for user_number in range(40):
            for _, attraction in catalog.sample(n=10, random_state=SEED + user_number).iterrows():
                affinity = affinities.get(attraction["type"], 0.15)
                budget_bonus = 0.25 if archetype == "budget" and attraction.estimatedCost <= 500 else 0
                rating = int(np.clip(round(2.4 + affinity * 2.2 + budget_bonus + rng.normal(0, 0.45)), 1, 5))
                rows.append({
                    "userId": f"synthetic-{archetype}-{user_number:03d}",
                    "attractionId": attraction.attractionId,
                    "rating": rating,
                    "archetype": archetype,
                    "dataOrigin": "semi_synthetic",
                    "generatorVersion": "1.0.0",
                    "seed": SEED,
                })
    synthetic = pd.DataFrame(rows)
    synthetic.to_csv(PROCESSED / "semi_synthetic_interactions.csv", index=False)
    type_means = synthetic.merge(catalog[["attractionId", "type"]], on="attractionId").groupby(["archetype", "type"]).rating.mean().unstack(fill_value=2.5)
    return {
        "modelVersion": "pakistan-content-v1.0.0",
        "modelType": "content_cold_start",
        "trainedWith": "real Pakistan attraction metadata plus labeled semi-synthetic archetype interactions",
        "finalEvaluationClaim": "No Pakistan accuracy claim; real benchmark metrics are reported separately",
        "generatorSeed": SEED,
        "archetypeTypeMeans": {index: {key: round(float(value), 4) for key, value in row.items()} for index, row in type_means.to_dict(orient="index").items()},
        "categories": sorted(catalog.type.unique().tolist()),
        "catalogSize": int(len(catalog)),
        "semiSyntheticRows": int(len(synthetic)),
    }


def write_model_card(metrics: dict, artifact: dict) -> None:
    selected = metrics["selected_benchmark_model"]
    lines = [
        "# Attraction Ranker Model Card",
        "",
        "## Purpose",
        "Rank live attraction candidates before Groq organizes an itinerary.",
        "",
        "## Evaluation data",
        "The real-only final test split comes from Huda et al. DOI 10.17632/h58s544674.1 (CC BY 4.0). It contains Indonesian attractions and is used only for algorithm benchmarking.",
        "",
        f"Selected benchmark model: `{selected}`. Integration gate passed: `{metrics['integration_gate_passed']}`.",
        "",
        "| Model | Recall@10 | NDCG@10 | MAP@10 | Coverage |",
        "|---|---:|---:|---:|---:|",
    ]
    for name, values in metrics["models"].items():
        lines.append(f"| {name} | {values['recall_at_10']} | {values['ndcg_at_10']} | {values['map_at_10']} | {values['catalog_coverage']} |")
    lines.extend([
        "",
        "## Production behavior",
        f"Pakistan candidates use `{artifact['modelVersion']}`, a content-based cold-start ranker calibrated with explicitly labeled semi-synthetic archetype interactions. It does not claim collaborative accuracy for Pakistani users.",
        "",
        "## Limitations",
        "The benchmark has only 30 Indonesian attractions, app interaction history is still sparse, and prices/weather remain external estimates. The service must retain deterministic fallback ranking.",
    ])
    (ARTIFACTS / "MODEL_CARD.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    verify_sources()
    PROCESSED.mkdir(parents=True, exist_ok=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    items, tx = load_real_data()
    metrics = benchmark(items, tx)
    artifact = build_pakistan_artifact()
    (ARTIFACTS / "benchmark_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (ARTIFACTS / "pakistan_ranker.json").write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    write_model_card(metrics, artifact)
    print(json.dumps({"metrics": metrics, "artifact": artifact}, indent=2))


if __name__ == "__main__":
    main()
