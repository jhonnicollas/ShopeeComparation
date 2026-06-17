# Scoring Engine

## Principle

AI explains; scoring decides.

Scoring engine must be deterministic and testable.

## Default Formula

```txt
finalScore =
  ratingScore
  + reviewCountScore
  + soldCountScore
  + priceScore
  + shopTrustScore
  + responseRateScore
  + featureMatchScore
  - riskPenalty
```

## Default Weight

| Component | Weight |
|---|---:|
| ratingScore | 15 |
| reviewCountScore | 15 |
| soldCountScore | 15 |
| priceScore | 15 |
| shopTrustScore | 20 |
| responseRateScore | 10 |
| featureMatchScore | 10 |
| riskPenalty | max 30 |

## Score Range

| Score | Label |
|---:|---|
| 85–100 | Sangat direkomendasikan |
| 70–84 | Direkomendasikan |
| 55–69 | Cukup |
| 40–54 | Perlu hati-hati |
| 0–39 | Tidak direkomendasikan |

## Risk Penalty Examples

| Risk | Severity | Impact |
|---|---|---:|
| lowReviewCount | medium | -8 |
| lowShopResponse | medium | -8 |
| missingWeight | low | -3 |
| suspiciousPrice | high | -12 |
| weakShopTrust | high | -15 |
| missingCriticalData | medium | -10 |
