export interface NineRouterTestRequest {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  prompt: string;
  timeoutMs: number;
}

function extractFirstJson(text: string): unknown | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (parseErr) {
    void parseErr;
  }
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1]!.trim());
    } catch (parseErr) {
      void parseErr;
    }
  }
  let depth = 0;
  let start = -1;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (trimmed[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1));
        } catch (parseErr) {
          void parseErr;
          start = -1;
        }
      }
    }
  }
  return null;
}

function parseResponseBody(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("data:")) {
    const dataLines: string[] = [];
    for (const line of trimmed.split("\n")) {
      const stripped = line.trim();
      if (stripped.startsWith("data:") && !stripped.includes("[DONE]")) {
        dataLines.push(stripped.slice(5).trim());
      }
    }
    const last = dataLines[dataLines.length - 1];
    if (last) {
      try {
        return JSON.parse(last);
      } catch (parseErr) {
        void parseErr;
      }
    }
    return {};
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const extracted = extractFirstJson(trimmed);
    return extracted ?? {};
  }
}

export interface NineRouterTestResult {
  status: "success" | "failed";
  latencyMs: number;
  outputValidJson: boolean;
  message: string;
  responseText?: string;
}

export async function testNineRouterModel(
  request: NineRouterTestRequest
): Promise<NineRouterTestResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const url = `${request.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: request.modelName,
        messages: [{ role: "user", content: request.prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: "failed",
        latencyMs,
        outputValidJson: false,
        message: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const responseBody = parseResponseBody(await response.text()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const responseText = responseBody.choices?.[0]?.message?.content ?? "";
    const extractedJson = extractFirstJson(responseText);
    let outputValidJson = false;
    if (extractedJson !== null) {
      outputValidJson = true;
    }

    return {
      status: "success",
      latencyMs,
      outputValidJson,
      message: outputValidJson ? "Model test succeeded" : "Model returned non-JSON response",
      responseText: responseText.slice(0, 500),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    const message =
      error instanceof Error ? error.message : "Unknown error during model test";
    return {
      status: "failed",
      latencyMs,
      outputValidJson: false,
      message: message.slice(0, 200),
    };
  }
}
