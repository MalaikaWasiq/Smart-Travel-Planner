# Attraction Ranker Model Card

## Purpose
Rank live attraction candidates before Groq organizes an itinerary.

## Evaluation data
The real-only final test split comes from Huda et al. DOI 10.17632/h58s544674.1 (CC BY 4.0). It contains Indonesian attractions and is used only for algorithm benchmarking.

Selected benchmark model: `item_knn_cosine`. Integration gate passed: `True`.

| Model | Recall@10 | NDCG@10 | MAP@10 | Coverage |
|---|---:|---:|---:|---:|
| popularity | 0.596673 | 0.247636 | 0.149485 | 0.533333 |
| content_type_profile | 0.419082 | 0.201648 | 0.137868 | 0.866667 |
| item_knn_cosine | 0.946811 | 0.574998 | 0.460103 | 0.966667 |
| truncated_svd | 0.542349 | 0.220552 | 0.130494 | 1.0 |

## Production behavior
Pakistan candidates use `pakistan-content-v1.0.0`, a content-based cold-start ranker calibrated with explicitly labeled semi-synthetic archetype interactions. It does not claim collaborative accuracy for Pakistani users.

## Limitations
The benchmark has only 30 Indonesian attractions, app interaction history is still sparse, and prices/weather remain external estimates. The service must retain deterministic fallback ranking.
