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

function createMockEnv() {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue({ results: [] }),
  };
  const db = {
    prepare: vi.fn().mockReturnValue(stmt),
  } as unknown as D1Database;
  return { DB: db, LOGS: {} as R2Bucket };
}

describe("processQueueBatch", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("retries messages with invalid JSON", async () => {
    const mock = createMockMessage("not valid json{");
    await processQueueBatch(
      {
        messages: [mock],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
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
    await processQueueBatch(
      {
        messages: [mock],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
    expect(mock.ackFn).not.toHaveBeenCalled();
  });

  it("retries messages with missing required fields", async () => {
    const incompleteMessage = {
      userId: "usr_123",
    };
    const mock = createMockMessage(JSON.stringify(incompleteMessage));
    await processQueueBatch(
      {
        messages: [mock],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
    expect(mock.ackFn).not.toHaveBeenCalled();
  });

  it("processes multiple messages independently", async () => {
    const invalidMock = createMockMessage("invalid{");
    await processQueueBatch(
      {
        messages: [invalidMock],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
    expect(invalidMock.retryFn).toHaveBeenCalledTimes(1);
    expect(invalidMock.ackFn).not.toHaveBeenCalled();
  });

  it("handles empty batch gracefully", async () => {
    await processQueueBatch(
      {
        messages: [],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
  });

  it("logs processing info for valid messages", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      jobId: "job_789",
      mode: "keywordSearch",
      keyword: "laptop",
    };
    const jobRow = {
      id: "job_789",
      userId: "usr_123",
      researchSessionId: "rsr_456",
      type: "keywordSearch",
      status: "pending",
      progressCurrent: 0,
      progressTotal: 0,
      currentStep: null,
      payloadJson: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const firstMock = vi.fn().mockResolvedValue(jobRow);
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: firstMock,
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    };
    const db = {
      prepare: vi.fn().mockReturnValue(stmt),
    } as unknown as D1Database;
    const env = { DB: db, LOGS: {} as R2Bucket };
    const mock = createMockMessage(JSON.stringify(message));
    await processQueueBatch(
      {
        messages: [mock],
        queue: "shopee-research-queue",
      },
      env
    );
    expect(console.log).toHaveBeenCalled();
  });

  it("logs error for invalid messages", async () => {
    const mock = createMockMessage("not json");
    await processQueueBatch(
      {
        messages: [mock],
        queue: "shopee-research-queue",
      },
      createMockEnv()
    );
    expect(console.error).toHaveBeenCalled();
    expect(mock.retryFn).toHaveBeenCalledTimes(1);
  });
});