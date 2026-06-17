import { beforeEach, describe, expect, it, vi } from "vitest";
import { type QueueMessage } from "@shopee-research/shared";
import { processQueueBatch } from "./index.js";

interface MockMessage {
  body: string;
  ack: () => void;
  retry: () => void;
}

function createMockMessage(body: string): MockMessage & {
  ackFn: ReturnType<typeof vi.fn>;
  retryFn: ReturnType<typeof vi.fn>;
} {
  const ackFn = vi.fn();
  const retryFn = vi.fn();
  return {
    body,
    ack: ackFn,
    retry: retryFn,
    ackFn,
    retryFn,
  };
}

describe("processQueueBatch", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("acknowledges valid queue messages", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "compareLinks",
      links: ["https://shopee.co.id/product-1"],
    };
    const mock = createMockMessage(JSON.stringify(message));
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(mock.ackFn).toHaveBeenCalledTimes(1);
    expect(mock.retryFn).not.toHaveBeenCalled();
  });

  it("retries invalid JSON messages", async () => {
    const mock = createMockMessage("not valid json{");
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
    expect(mock.ackFn).not.toHaveBeenCalled();
  });

  it("retries messages that fail schema validation", async () => {
    const invalidMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "invalidMode",
    };
    const mock = createMockMessage(JSON.stringify(invalidMessage));
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
    expect(mock.ackFn).not.toHaveBeenCalled();
  });

  it("retries messages with missing required fields", async () => {
    const incompleteMessage = {
      userId: "usr_123",
    };
    const mock = createMockMessage(JSON.stringify(incompleteMessage));
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
    expect(mock.ackFn).not.toHaveBeenCalled();
  });

  it("processes multiple messages independently", async () => {
    const validMessage: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "compareLinks",
      links: ["https://shopee.co.id/product-1"],
    };
    const validMock = createMockMessage(JSON.stringify(validMessage));
    const invalidMock = createMockMessage("invalid{");
    await processQueueBatch({
      messages: [validMock, invalidMock],
      queue: "shopee-research-queue",
    });
    expect(validMock.ackFn).toHaveBeenCalledTimes(1);
    expect(validMock.retryFn).not.toHaveBeenCalled();
    expect(invalidMock.retryFn).toHaveBeenCalledTimes(1);
    expect(invalidMock.ackFn).not.toHaveBeenCalled();
  });

  it("handles empty batch gracefully", async () => {
    await processQueueBatch({
      messages: [],
      queue: "shopee-research-queue",
    });
  });

  it("logs processing info for valid messages", async () => {
    const logSpy = vi.spyOn(console, "log");
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "keywordSearch",
      keyword: "laptop",
    };
    const mock = createMockMessage(JSON.stringify(message));
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(logSpy).toHaveBeenCalled();
    expect(mock.ackFn).toHaveBeenCalledTimes(1);
  });

  it("logs error for invalid messages", async () => {
    const errorSpy = vi.spyOn(console, "error");
    const mock = createMockMessage("not json");
    await processQueueBatch({
      messages: [mock],
      queue: "shopee-research-queue",
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
  });
});
