export type PartialSuccessStatus = "completed" | "partialSuccess" | "failed";

export interface ItemAttempt<T> {
  item: T;
  status: "success" | "failed";
  result?: unknown;
  error?: string;
  durationMs: number;
}

export interface PartialSuccessResult<T> {
  status: PartialSuccessStatus;
  successful: ItemAttempt<T>[];
  failed: ItemAttempt<T>[];
  totalCount: number;
  successCount: number;
  failureCount: number;
}

export function summarizeAttempts<T>(attempts: ItemAttempt<T>[]): PartialSuccessResult<T> {
  const successful = attempts.filter((a) => a.status === "success");
  const failed = attempts.filter((a) => a.status === "failed");
  const totalCount = attempts.length;
  const successCount = successful.length;
  const failureCount = failed.length;
  let status: PartialSuccessStatus;
  if (successCount === 0 && failureCount === 0) {
    status = "failed";
  } else if (successCount === 0) {
    status = "failed";
  } else if (failureCount === 0) {
    status = "completed";
  } else {
    status = "partialSuccess";
  }
  return { status, successful, failed, totalCount, successCount, failureCount };
}

export async function processItemsWithPartialSuccess<T>(
  items: T[],
  processor: (item: T) => Promise<unknown>
): Promise<PartialSuccessResult<T>> {
  const attempts: ItemAttempt<T>[] = [];
  for (const item of items) {
    const start = Date.now();
    try {
      const result = await processor(item);
      attempts.push({
        item,
        status: "success",
        result,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      attempts.push({
        item,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      });
    }
  }
  return summarizeAttempts(attempts);
}

export function isPartialSuccess(result: PartialSuccessResult<unknown>): boolean {
  return result.status === "partialSuccess";
}
