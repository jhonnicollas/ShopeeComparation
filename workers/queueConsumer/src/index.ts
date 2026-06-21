import { type QueueMessage, queueMessageSchema, researchMode, jobStatus } from "@shopee-research/shared";
import { Hono } from "hono";
import {
  findJobById,
  findLatestJobByResearchSession,
  updateJobStatus,
  updateResearchSessionStatus,
  createJobLog,
  createExtractionFailure,
} from "@shopee-research/db";
import { processJobSync } from "@shopee-research/ai";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  APP_ENV?: string;
  NINEROUTER_BASE_URL?: string;
  NINEROUTER_API_KEY?: string;
  BROWSER_RUN_BASE_URL?: string;
  BROWSER_RUN_API_KEY?: string;
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

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

function sanitizeError(msg: string | undefined): string {
  if (!msg) return "Unknown error";
  return msg
    .replace(/api[_-]?key\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/token\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/secret\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/bearer\s+\S+/gi, "[REDACTED]")
    .slice(0, 200);
}

export async function processQueueBatch(batch: QueueMessageBatch, env: Bindings): Promise<void> {
  for (const message of batch.messages) {
    let queueMessage: QueueMessage | null = null;
    try {
      const parsed = JSON.parse(message.body);
      const result = queueMessageSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Invalid queue message:", result.error.issues);
        message.retry();
        continue;
      }
      queueMessage = result.data;
      const m = queueMessage;

      let job = m.jobId ? await findJobById(env.DB, m.jobId) : null;
      if (!job) {
        job = await findLatestJobByResearchSession(env.DB, m.researchSessionId);
      }
      const jobId = job?.id ?? "";
      if (!jobId) {
        console.error(`[Queue] No job found for queue message session=${m.researchSessionId}`);
        message.ack();
        continue;
      }

      await updateJobStatus(env.DB, jobId, jobStatus.processing, {
        currentStep: "started",
        progressCurrent: 0,
      });
      await createJobLog(env.DB, {
        id: generateId("log"),
        jobId,
        level: "info",
        message: `[Queue] Processing job ${jobId} for session ${m.researchSessionId} (${m.mode})`,
        metadataJson: JSON.stringify({ mode: m.mode, keyword: m.keyword ?? null, linkCount: m.links?.length ?? 0 }),
      });

      console.log("[Queue] Processing job", { jobId, sessionId: m.researchSessionId, mode: m.mode });

      await processJobSync(
        {
          DB: env.DB,
          LOGS: env.LOGS,
          ...(env.NINEROUTER_BASE_URL ? { NINEROUTER_BASE_URL: env.NINEROUTER_BASE_URL } : {}),
          ...(env.NINEROUTER_API_KEY ? { NINEROUTER_API_KEY: env.NINEROUTER_API_KEY } : {}),
          ...(env.BROWSER_RUN_BASE_URL ? { BROWSER_RUN_BASE_URL: env.BROWSER_RUN_BASE_URL } : {}),
          ...(env.BROWSER_RUN_API_KEY ? { BROWSER_RUN_API_KEY: env.BROWSER_RUN_API_KEY } : {}),
        },
        m,
        jobId
      );

      message.ack();
    } catch (error) {
      console.error("[Queue] Error processing message:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      const safeErr = sanitizeError(errMsg) || "Unknown error";
      try {
        if (queueMessage) {
          const job = queueMessage.jobId
            ? await findJobById(env.DB, queueMessage.jobId)
            : await findLatestJobByResearchSession(env.DB, queueMessage.researchSessionId);
          if (job) {
            await updateJobStatus(env.DB, job.id, jobStatus.failed, {
              errorMessage: safeErr,
              currentStep: "failed",
            });
            await updateResearchSessionStatus(env.DB, queueMessage.researchSessionId, jobStatus.failed, {
              errorMessage: safeErr,
            });
            await createJobLog(env.DB, {
              id: generateId("log"),
              jobId: job.id,
              level: "error",
              message: `Job gagal: ${safeErr}`,
            });
            await createExtractionFailure(env.DB, {
              id: generateId("efl"),
              ownerId: queueMessage.researchSessionId,
              ownerType: "session",
              adapter: "queueConsumer",
              url: queueMessage.links?.[0] ?? queueMessage.keyword ?? null,
              errorMessage: safeErr,
            });
          }
        }
      } catch (innerErr) {
        console.error("[Queue] Failed to record job failure:", innerErr);
      }
      message.retry();
    }
  }
  void researchMode;
}

export default {
  async queue(batch: MessageBatch, env: Bindings, ctx: ExecutionContext): Promise<void> {
    void ctx;
    await processQueueBatch(batch as unknown as QueueMessageBatch, env);
  },
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
