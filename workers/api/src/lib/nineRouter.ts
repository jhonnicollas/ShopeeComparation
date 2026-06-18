export interface NineRouterTestRequest {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  prompt: string;
  timeoutMs: number;
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

    const responseBody = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const responseText = responseBody.choices?.[0]?.message?.content ?? "";
    let outputValidJson = false;
    try {
      JSON.parse(responseText);
      outputValidJson = true;
    } catch {
      outputValidJson = false;
    }

    return {
      status: "success",
      latencyMs,
      outputValidJson,
      message: "Model test succeeded",
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
