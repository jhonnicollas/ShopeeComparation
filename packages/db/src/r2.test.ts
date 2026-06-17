import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateR2Key, getSnapshot, getSnapshotText, putSnapshot } from "./r2.js";

interface MockR2Object {
  body: ReadableStream;
  httpMetadata?: R2HTTPMetadata | Headers;
  size: number;
  customMetadata?: Record<string, string>;
}

class MockR2Bucket {
  private store = new Map<string, MockR2Object>();

  async put(
    key: string,
    data: string | ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: R2HTTPMetadata | Headers; customMetadata?: Record<string, string> }
  ): Promise<MockR2Object> {
    const size = typeof data === "string" ? new Blob([data]).size : 0;
    const object: MockR2Object = {
      body: new ReadableStream(),
      httpMetadata: options?.httpMetadata,
      size,
      customMetadata: options?.customMetadata,
    };
    this.store.set(key, object);
    return object;
  }

  async get(key: string): Promise<MockR2Object | null> {
    return this.store.get(key) ?? null;
  }

  setObject(key: string, object: MockR2Object): void {
    this.store.set(key, object);
  }
}

describe("generateR2Key", () => {
  it("generates key with owner type and ID", () => {
    const key = generateR2Key("product", "prd_123");
    expect(key).toMatch(/^snapshots\/product\/prd_123\/\d+\.json$/);
  });

  it("sanitizes special characters in owner ID", () => {
    const key = generateR2Key("shop", "shp/abc#123");
    expect(key).toMatch(/^snapshots\/shop\/shp_abc_123\/\d+\.json$/);
  });

  it("includes suffix when provided", () => {
    const key = generateR2Key("ai", "air_456", "report");
    expect(key).toMatch(/^snapshots\/ai\/air_456\/\d+_report\.json$/);
  });

  it("uses correct prefix for resolver owner type", () => {
    const key = generateR2Key("resolver", "url_789");
    expect(key).toMatch(/^snapshots\/resolver\/url_789\/\d+\.json$/);
  });
});

describe("putSnapshot", () => {
  let bucket: MockR2Bucket;

  beforeEach(() => {
    bucket = new MockR2Bucket();
  });

  it("uploads data to R2 and returns key with metadata", async () => {
    const data = JSON.stringify({ foo: "bar" });
    const result = await putSnapshot({
      bucket: bucket as unknown as R2Bucket,
      ownerType: "product",
      ownerId: "prd_123",
      contentType: "application/json",
      data,
    });
    expect(result.r2Key).toMatch(/^snapshots\/product\/prd_123\/\d+\.json$/);
    expect(result.contentType).toBe("application/json");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("includes custom metadata in R2 object", async () => {
    const putSpy = vi.spyOn(bucket, "put");
    await putSnapshot({
      bucket: bucket as unknown as R2Bucket,
      ownerType: "shop",
      ownerId: "shp_456",
      contentType: "application/json",
      data: "test",
      metadata: { source: "shopee-web-fetch" },
    });
    expect(putSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^snapshots\/shop\/shp_456\/\d+\.json$/),
      "test",
      expect.objectContaining({
        customMetadata: expect.objectContaining({
          source: "shopee-web-fetch",
          ownerType: "shop",
          ownerId: "shp_456",
        }),
      })
    );
  });

  it("sets content type in HTTP metadata", async () => {
    const putSpy = vi.spyOn(bucket, "put");
    await putSnapshot({
      bucket: bucket as unknown as R2Bucket,
      ownerType: "ai",
      ownerId: "air_789",
      contentType: "text/plain",
      data: "test",
    });
    expect(putSpy).toHaveBeenCalledWith(
      expect.any(String),
      "test",
      expect.objectContaining({
        httpMetadata: expect.objectContaining({
          contentType: "text/plain",
        }),
      })
    );
  });
});

describe("getSnapshot", () => {
  let bucket: MockR2Bucket;

  beforeEach(() => {
    bucket = new MockR2Bucket();
  });

  it("returns null when object does not exist", async () => {
    const result = await getSnapshot(bucket as unknown as R2Bucket, "missing-key");
    expect(result).toBeNull();
  });

  it("returns object with data and metadata when found", async () => {
    const stream = new ReadableStream();
    const mockObject: MockR2Object = {
      body: stream,
      httpMetadata: { contentType: "application/json" } as R2HTTPMetadata,
      size: 100,
    };
    bucket.setObject("snapshots/product/prd_123/123.json", mockObject);
    const result = await getSnapshot(
      bucket as unknown as R2Bucket,
      "snapshots/product/prd_123/123.json"
    );
    expect(result).not.toBeNull();
    expect(result?.data).toBe(stream);
    expect(result?.contentType).toBe("application/json");
    expect(result?.sizeBytes).toBe(100);
  });

  it("returns null content type when metadata is missing", async () => {
    const stream = new ReadableStream();
    const mockObject: MockR2Object = {
      body: stream,
      size: 50,
    };
    bucket.setObject("test-key", mockObject);
    const result = await getSnapshot(bucket as unknown as R2Bucket, "test-key");
    expect(result?.contentType).toBeNull();
    expect(result?.sizeBytes).toBe(50);
  });
});

describe("getSnapshotText", () => {
  it("returns null when object does not exist", async () => {
    const bucket = new MockR2Bucket();
    const result = await getSnapshotText(
      bucket as unknown as R2Bucket,
      "missing-key"
    );
    expect(result).toBeNull();
  });
});
