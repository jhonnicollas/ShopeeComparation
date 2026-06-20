import { type EnvVars, envSchema } from "./schemas/env.js";

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public issues: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = "EnvValidationError";
  }
}

export interface EnvValidationResult {
  env: EnvVars;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
}

export function validateEnv(input: Record<string, string | undefined>): EnvValidationResult {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const errorMessage = `Environment validation failed:\n${issues
      .map((i) => `  - ${i.path}: ${i.message}`)
      .join("\n")}`;
    throw new EnvValidationError(errorMessage, issues);
  }
  const env = result.data;
  return {
    env,
    isProduction: env.APP_ENV === "production",
    isStaging: env.APP_ENV === "staging",
    isDevelopment: env.APP_ENV === "development",
  };
}

export function safeValidateEnv(
  input: Record<string, string | undefined>
):
  | { success: true; data: EnvValidationResult }
  | { success: false; error: EnvValidationError } {
  try {
    const data = validateEnv(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return { success: false, error };
    }
    throw error;
  }
}
