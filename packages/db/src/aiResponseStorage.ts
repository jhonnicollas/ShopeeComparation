import { putSnapshot } from "./r2.js";

export async function saveRawAiResponse(
  bucket: R2Bucket,
  comparisonId: string,
  rawText: string,
  model: string
): Promise<string> {
  const result = await putSnapshot({
    bucket,
    ownerType: "ai",
    ownerId: comparisonId,
    contentType: "application/json",
    data: JSON.stringify({
      comparisonId,
      model,
      rawText,
      savedAt: new Date().toISOString(),
    }),
    metadata: {
      comparisonId,
      model,
    },
  });
  return result.r2Key;
}

export function getRawAiResponseKey(comparisonId: string): string {
  return `snapshots/ai/${comparisonId}/${Date.now()}.json`;
}
