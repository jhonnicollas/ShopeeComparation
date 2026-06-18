import type { QueueMessage } from "@shopee-research/shared";

export type WorkflowStep<TInput, TOutput> = (
  input: TInput
) => Promise<TOutput>;

export interface WorkflowStepResult<T> {
  stepName: string;
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface WorkflowContext {
  message: QueueMessage;
  db: D1Database;
  logs: R2Bucket;
  env: Record<string, string | undefined>;
}

export async function runWorkflowStep<TInput, TOutput>(
  stepName: string,
  step: WorkflowStep<TInput, TOutput>,
  input: TInput
): Promise<WorkflowStepResult<TOutput>> {
  const start = Date.now();
  try {
    const data = await step(input);
    return {
      stepName,
      success: true,
      data,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      stepName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - start,
    };
  }
}

export async function runWorkflowSteps<TInitial>(
  steps: Array<{ name: string; run: (input: TInitial) => Promise<unknown> }>,
  initialInput: TInitial
): Promise<WorkflowStepResult<unknown>[]> {
  const results: WorkflowStepResult<unknown>[] = [];
  let currentInput: unknown = initialInput;
  for (const step of steps) {
    const result = await runWorkflowStep(step.name, step.run, currentInput as TInitial);
    results.push(result);
    if (!result.success) {
      break;
    }
    currentInput = result.data;
  }
  return results;
}
