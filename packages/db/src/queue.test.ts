import { beforeEach, describe, expect, it } from "vitest";
import { sendBatchResearchJobMessages, sendResearchJobMessage } from "./queue.js";
import type { QueueMessage } from "@shopee-research/shared";

interface SentMessage {
  body: string;
  contentType: string;
  messageId: string;
}

class MockQueue {
  public messages: SentMessage[] = [];

  async send(message: { body: string; contentType: string; messageId: string }): Promise<void> {
    this.messages.push(message);
  }
}

describe("sendResearchJobMessage", () => {
  let queue: MockQueue;

  beforeEach(() => {
    queue = new MockQueue();
  });

  it("sends a valid research job message to the queue", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "compareLinks",
      links: ["https://shopee.co.id/product-1"],
    };
    const result = await sendResearchJobMessage({
      queue: queue as unknown as Queue,
      message,
    });
    expect(result.messageId).toMatch(/^msg_/);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(queue.messages).toHaveLength(1);
  });

  it("includes sentAt timestamp in message body", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "keywordSearch",
      keyword: "laptop",
    };
    await sendResearchJobMessage({
      queue: queue as unknown as Queue,
      message,
    });
    const sent = queue.messages[0];
    const parsed = JSON.parse(sent.body);
    expect(parsed.sentAt).toBeDefined();
    expect(parsed.userId).toBe("usr_123");
    expect(parsed.mode).toBe("keywordSearch");
    expect(parsed.keyword).toBe("laptop");
  });

  it("uses json content type", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "compareLinks",
      links: ["https://shopee.co.id/product-1"],
    };
    await sendResearchJobMessage({
      queue: queue as unknown as Queue,
      message,
    });
    expect(queue.messages[0].contentType).toBe("json");
  });

  it("generates unique message IDs for each send", async () => {
    const message: QueueMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "compareLinks",
      links: ["https://shopee.co.id/product-1"],
    };
    const result1 = await sendResearchJobMessage({
      queue: queue as unknown as Queue,
      message,
    });
    const result2 = await sendResearchJobMessage({
      queue: queue as unknown as Queue,
      message,
    });
    expect(result1.messageId).not.toBe(result2.messageId);
  });

  it("throws error for invalid message payload", async () => {
    const invalidMessage = {
      userId: "usr_123",
      researchSessionId: "rsr_456",
      mode: "invalidMode",
    } as unknown as QueueMessage;
    await expect(
      sendResearchJobMessage({
        queue: queue as unknown as Queue,
        message: invalidMessage,
      })
    ).rejects.toThrow();
    expect(queue.messages).toHaveLength(0);
  });

  it("validates message with missing required fields", async () => {
    const invalidMessage = {
      userId: "usr_123",
    } as unknown as QueueMessage;
    await expect(
      sendResearchJobMessage({
        queue: queue as unknown as Queue,
        message: invalidMessage,
      })
    ).rejects.toThrow();
  });
});

describe("sendBatchResearchJobMessages", () => {
  let queue: MockQueue;

  beforeEach(() => {
    queue = new MockQueue();
  });

  it("sends multiple messages in sequence", async () => {
    const messages: QueueMessage[] = [
      {
        userId: "usr_123",
        researchSessionId: "rsr_456",
        mode: "compareLinks",
        links: ["https://shopee.co.id/product-1"],
      },
      {
        userId: "usr_123",
        researchSessionId: "rsr_789",
        mode: "keywordSearch",
        keyword: "phone",
      },
    ];
    const results = await sendBatchResearchJobMessages(
      queue as unknown as Queue,
      messages
    );
    expect(results).toHaveLength(2);
    expect(queue.messages).toHaveLength(2);
  });

  it("returns empty array for empty messages", async () => {
    const results = await sendBatchResearchJobMessages(
      queue as unknown as Queue,
      []
    );
    expect(results).toHaveLength(0);
    expect(queue.messages).toHaveLength(0);
  });

  it("stops on first invalid message", async () => {
    const messages: QueueMessage[] = [
      {
        userId: "usr_123",
        researchSessionId: "rsr_456",
        mode: "compareLinks",
        links: ["https://shopee.co.id/product-1"],
      },
      {
        userId: "usr_123",
        researchSessionId: "rsr_789",
        mode: "invalidMode" as unknown as "compareLinks",
      },
    ];
    await expect(
      sendBatchResearchJobMessages(queue as unknown as Queue, messages)
    ).rejects.toThrow();
    expect(queue.messages).toHaveLength(1);
  });
});
