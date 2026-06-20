import { describe, expect, it } from "vitest";
import { saveRawAiResponse, getRawAiResponseKey } from "./aiResponseStorage.js";

interface MockR2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  size: number;
  customMetadata?: Record<string, string>;
}

class MockR2Bucket {
  public store = new Map<string, MockR2Object>();

  async put(
    key: string,
    data: string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ): Promise<MockR2Object> {
    const object: MockR2Object = {
      body: new ReadableStream(),
      httpMetadata: options?.httpMetadata,
      size: data.length,
      customMetadata: options?.customMetadata,
    };
    this.store.set(key, object);
    return object;
  }
}

describe("saveRawAiResponse", () => {
  it("saves raw AI response to R2", async () => {
    const bucket = new MockR2Bucket();
    const key = await saveRawAiResponse(
      bucket as unknown as R2Bucket,
      "cmp_test",
      '{"test": "data"}',
      "test-model"
    );
    expect(key).toMatch(/^snapshots\/ai\/cmp_test\/\d+\.json$/);
    expect(bucket.store.size).toBe(1);
  });
});

describe("getRawAiResponseKey", () => {
  it("returns expected key", () => {
    expect(getRawAiResponseKey("cmp_1")).toMatch(/^snapshots\/ai\/cmp_1\/\d+\.json$/);
  });
});
