import { type QueueMessage, queueMessageSchema } from "@shopee-research/shared";

export interface SendResearchJobInput {
  queue: Queue;
  message: QueueMessage;
}

export interface SendResearchJobResult {
  messageId: string;
  sentAt: string;
}

export async function sendResearchJobMessage(
  input: SendResearchJobInput
): Promise<SendResearchJobResult> {
  const { queue, message } = input;
  const validated = queueMessageSchema.parse(message);
  const sentAt = new Date().toISOString();
  const messageWithTimestamp = {
    ...validated,
    sentAt,
  };
  const messageId = await generateMessageId();
  await queue.send({
    body: JSON.stringify(messageWithTimestamp),
    contentType: "json",
    messageId,
  });
  return {
    messageId,
    sentAt,
  };
}

export async function sendBatchResearchJobMessages(
  queue: Queue,
  messages: QueueMessage[]
): Promise<SendResearchJobResult[]> {
  const results: SendResearchJobResult[] = [];
  for (const message of messages) {
    const result = await sendResearchJobMessage({ queue, message });
    results.push(result);
  }
  return results;
}

async function generateMessageId(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `msg_${timestamp}_${random}`;
}
