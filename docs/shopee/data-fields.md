# Shopee Data Fields

Dokumen ini adalah source of truth untuk field produk, toko, berat, fitur, dan review.

## Product Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Internal id |
| shopeeItemId | string | no | External Shopee item id |
| shopeeShopId | string | no | External Shopee shop id |
| title | string | no | Product title |
| brand | string | no | Brand if available |
| category | string | no | Category if available |
| originalUrl | string | no | Input URL |
| canonicalUrl | string | no | Clean product URL |
| imageUrl | string | no | Main image |
| galleryImagesJson | string | no | JSON array |
| priceMin | number | no | IDR |
| priceMax | number | no | IDR |
| priceBeforeDiscount | number | no | IDR |
| discountText | string | no | Discount label |
| rating | number | no | Product rating |
| reviewCount | number | no | Total review |
| soldCount | number | no | Total sold |
| favoriteCount | number | no | Favorite count |
| stock | number | no | Stock |
| shippedFrom | string | no | Shipping origin |
| description | string | no | Product description |
| specificationJson | string | no | JSON spec |
| variationJson | string | no | JSON variant |
| confidenceScore | number | yes | 0 to 1 |
| rawSnapshotKey | string | no | R2 key |

## Product Weight Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| productId | string | yes | Internal product id |
| value | number | no | Numeric weight |
| unit | string | no | gram or kg |
| rawText | string | no | Original text |
| source | string | no | Source of extraction |
| confidence | number | yes | 0 to 1 |

## Shop Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| id | string | yes | Internal id |
| shopeeShopId | string | no | External Shopee shop id |
| name | string | no | Shop name |
| shopUrl | string | no | Shop URL |
| statusJson | string | no | JSON status labels |
| primaryStatus | string | yes | MALL, OFFICIAL, STAR, STAR_PLUS, REGULAR, UNKNOWN |
| rating | number | no | Shop rating |
| ratingCount | number | no | Rating count |
| responseRate | number | no | Percentage |
| responseTime | string | no | Text |
| followerCount | number | no | Followers |
| productCount | number | no | Product count |
| joinedAgeText | string | no | Joined text |
| location | string | no | Shop location |
| confidenceScore | number | yes | 0 to 1 |
| rawSnapshotKey | string | no | R2 key |

## Feature Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| productId | string | yes | Product reference |
| name | string | yes | Feature name |
| value | string | no | Feature value |
| source | string | no | TITLE, DESCRIPTION, SPECIFICATION, AI_EXTRACTED |
| confidence | number | yes | 0 to 1 |

## Review Summary Fields

Review detail is optional in MVP. Summary fields:

- reviewCount
- rating
- ratingBreakdownJson
- positiveSummary
- negativeSummary
- recurringComplaints
- riskSignals
- hasPhotoReview
- hasVideoReview

## Data Quality Requirement

Every extracted field should have traceable source and confidence when possible.
