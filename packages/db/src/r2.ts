export type R2SnapshotOwnerType = "product" | "shop" | "ai" | "resolver";

export interface PutSnapshotInput {
  bucket: R2Bucket;
  ownerType: R2SnapshotOwnerType;
  ownerId: string;
  contentType: string;
  data: string | ArrayBuffer | ReadableStream;
  metadata?: Record<string, string>;
}

export interface PutSnapshotResult {
  r2Key: string;
  sizeBytes: number;
  contentType: string;
}

export interface GetSnapshotResult {
  data: ReadableStream;
  contentType: string | null;
  sizeBytes: number;
}

export function generateR2Key(
  ownerType: R2SnapshotOwnerType,
  ownerId: string,
  suffix: string = ""
): string {
  const timestamp = Date.now();
  const sanitizedId = ownerId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sanitizedSuffix = suffix ? `_${suffix.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
  return `snapshots/${ownerType}/${sanitizedId}/${timestamp}${sanitizedSuffix}.json`;
}

export async function putSnapshot(input: PutSnapshotInput): Promise<PutSnapshotResult> {
  const { bucket, ownerType, ownerId, contentType, data, metadata } = input;
  const r2Key = generateR2Key(ownerType, ownerId);
  const r2Metadata: Record<string, string> = {
    ownerType,
    ownerId,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  };
  const r2HttpMetadata: R2HTTPMetadata = {
    contentType,
  };
  await bucket.put(r2Key, data, {
    httpMetadata: r2HttpMetadata,
    customMetadata: r2Metadata,
  });
  const sizeBytes = typeof data === "string" ? new Blob([data]).size : 0;
  return {
    r2Key,
    sizeBytes,
    contentType,
  };
}

export async function getSnapshot(
  bucket: R2Bucket,
  r2Key: string
): Promise<GetSnapshotResult | null> {
  const object = await bucket.get(r2Key);
  if (!object) {
    return null;
  }
  let contentType: string | null = null;
  if (object.httpMetadata) {
    if ("contentType" in object.httpMetadata && typeof object.httpMetadata.contentType === "string") {
      contentType = object.httpMetadata.contentType;
    } else if (object.httpMetadata instanceof Headers) {
      contentType = object.httpMetadata.get("content-type");
    }
  }
  return {
    data: object.body,
    contentType,
    sizeBytes: object.size,
  };
}

export async function getSnapshotText(
  bucket: R2Bucket,
  r2Key: string
): Promise<string | null> {
  const result = await getSnapshot(bucket, r2Key);
  if (!result) {
    return null;
  }
  return new Response(result.data).text();
}
