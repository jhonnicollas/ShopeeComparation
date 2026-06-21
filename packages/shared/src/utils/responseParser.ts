export function extractFirstJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
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

export function parseResponseBody(rawText: string): unknown {
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

export function parseToolCallArguments(rawArgs: string): unknown | null {
  if (!rawArgs) return null;
  const trimmed = rawArgs.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const extracted = extractFirstJson(trimmed);
    if (extracted !== null) return extracted;
    try {
      const withoutTrailingCommas = trimmed.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(withoutTrailingCommas);
    } catch {
      return null;
    }
  }
}
