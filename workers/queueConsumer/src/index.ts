import { type QueueMessage, queueMessageSchema } from "@shopee-research/shared";
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/health", (c) => {
  return c.json({ status: "ok", worker: "queue-consumer" });
});

export interface QueueMessageBatch {
  messages: Array<{
    body: string;
    ack: () => void;
    retry: () => void;
  }>;
  queue: string;
}

export async function processQueueBatch(batch: QueueMessageBatch): Promise<void> {
  for (const message of batch.messages) {
    try {
      const parsed = JSON.parse(message.body);
      const result = queueMessageSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Invalid queue message:", result.error.issues);
        message.retry();
        continue;
      }
      const queueMessage: QueueMessage = result.data;
      console.log("Processing research job:", {
        userId: queueMessage.userId,
        researchSessionId: queueMessage.researchSessionId,
        mode: queueMessage.mode,
      });
      message.ack();
    } catch (error) {
      console.error("Error processing queue message:", error);
      message.retry();
    }
  }
}

export default {
  async queue(batch: MessageBatch, env: Bindings, ctx: ExecutionContext): Promise<void> {
    void env;
    void ctx;
    await processQueueBatch(batch as unknown as QueueMessageBatch);
  },
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
