# Prompt Contract

Semua prompt AI wajib mengikuti kontrak ini agar output stabil, tidak mengarang, dan mudah divalidasi.

## Global AI Rules

1. AI hanya boleh memakai data yang diberikan dalam input.
2. AI tidak boleh browsing sendiri.
3. AI tidak boleh mengarang data produk, harga, berat, rating, atau reputasi toko.
4. Jika data tidak tersedia, sebutkan bahwa data tidak tersedia.
5. AI tidak boleh mengubah score numeric yang sudah dihitung scoring engine.
6. Output harus valid JSON jika diminta.
7. Prompt harus memiliki version.

## Recommendation Report Input

```json
{
  "comparisonId": "cmp_123",
  "products": [],
  "shops": [],
  "scores": [],
  "risks": [],
  "missingDataNotes": []
}
```

## Recommendation Report Output

```json
{
  "bestProductId": "prd_123",
  "bestValueProductId": "prd_456",
  "safestProductId": "prd_789",
  "summary": "string",
  "reasons": ["string"],
  "rankings": [
    {
      "productId": "prd_123",
      "rank": 1,
      "reason": "string"
    }
  ],
  "warnings": ["string"],
  "missingDataNotes": ["string"],
  "confidence": 0.85
}
```

## Feature Extraction Output

```json
{
  "features": [
    {
      "name": "string",
      "value": "string",
      "source": "TITLE | DESCRIPTION | SPECIFICATION | AI_EXTRACTED",
      "confidence": 0.8
    }
  ]
}
```

## Risk Analysis Output

```json
{
  "risks": [
    {
      "type": "LOW_REVIEW_COUNT",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "impact": 8
    }
  ]
}
```

## Forbidden Output

AI tidak boleh menjawab:

```txt
Produk ini pasti original jika tidak ada data original.
Berat produk 500 gram jika tidak ada data berat.
Rating toko bagus jika rating toko tidak tersedia.
```

## Prompt Versioning

Setiap prompt harus memiliki:

- promptName
- promptVersion
- expectedOutputSchema
- model
- provider
