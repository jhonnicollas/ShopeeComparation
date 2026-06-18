import type { ProductFeatureItem } from "@shopee-research/shared";

export interface ExtractFeaturesInput {
  html?: string;
  json?: unknown;
  text?: string;
}

type FeatureSource = "productSpecification" | "description" | "metadata" | "aiExtraction";

function dedupeFeatures(features: ProductFeatureItem[]): ProductFeatureItem[] {
  const seen = new Set<string>();
  const result: ProductFeatureItem[] = [];
  for (const f of features) {
    const key = `${f.name.toLowerCase()}:${(f.value ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(f);
  }
  return result;
}

function extractFromHtmlTable(html: string): ProductFeatureItem[] {
  const features: ProductFeatureItem[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[hd][^>]*>([^<]+)<\/t[hd]>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    const cellReg = new RegExp(cellRegex.source, cellRegex.flags);
    while ((cellMatch = cellReg.exec(rowMatch[1] ?? "")) !== null) {
      cells.push((cellMatch[1] ?? "").trim());
    }
    if (cells.length >= 2 && cells[0] && cells[1]) {
      const name = cells[0];
      const value = cells[1];
      if (name.toLowerCase() === name.toUpperCase() || name.length < 50) {
        features.push({
          name: name.toLowerCase(),
          value,
          source: "productSpecification",
          confidence: 0.9,
        });
      }
    }
  }
  return features;
}

function extractFromHtmlList(html: string): ProductFeatureItem[] {
  const features: ProductFeatureItem[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liRegex.exec(html)) !== null) {
    const content = (match[1] ?? "").trim();
    const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const colonMatch = text.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      features.push({
        name: colonMatch[1].trim().toLowerCase(),
        value: colonMatch[2].trim(),
        source: "productSpecification",
        confidence: 0.8,
      });
    }
  }
  return features;
}

function extractFromJsonSpec(json: Record<string, unknown>, source: FeatureSource, confidence: number): ProductFeatureItem[] {
  const features: ProductFeatureItem[] = [];
  for (const [key, value] of Object.entries(json)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      features.push({
        name: key,
        value: String(value),
        source,
        confidence,
      });
    } else if (Array.isArray(value)) {
      features.push({
        name: key,
        value: value.filter((v) => typeof v === "string" || typeof v === "number").map(String).join(", "),
        source,
        confidence,
      });
    } else if (value && typeof value === "object") {
      const label = (value as Record<string, unknown>).label ?? (value as Record<string, unknown>).name;
      if (typeof label === "string") {
        features.push({ name: key, value: label, source, confidence });
      }
    }
  }
  return features;
}

function extractFromText(text: string): ProductFeatureItem[] {
  const features: ProductFeatureItem[] = [];
  const lineRegex = /^([^:]{2,40}):\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(text)) !== null) {
    const name = (match[1] ?? "").trim();
    const value = (match[2] ?? "").trim();
    if (name && value && value.length < 200) {
      features.push({
        name: name.toLowerCase(),
        value,
        source: "description",
        confidence: 0.6,
      });
    }
  }
  return features;
}

function extractFromDescription(description: string): ProductFeatureItem[] {
  const features: ProductFeatureItem[] = [];
  const featuresRegex = /fitur\s*:?\s*([^\n.]{2,200})/gi;
  let match: RegExpExecArray | null;
  while ((match = featuresRegex.exec(description)) !== null) {
    const raw = (match[1] ?? "").trim();
    const parts = raw.split(/[,;]/);
    for (const part of parts) {
      const text = part.trim();
      if (text.length > 2 && text.length < 100) {
        features.push({
          name: "fitur",
          value: text,
          source: "description",
          confidence: 0.5,
        });
      }
    }
  }
  return features;
}

export class FeatureExtractor {
  extractFeatures(input: ExtractFeaturesInput): ProductFeatureItem[] {
    const features: ProductFeatureItem[] = [];
    try {
      if (input.html) {
        features.push(...extractFromHtmlTable(input.html));
        features.push(...extractFromHtmlList(input.html));
      }
      if (input.json) {
        if (typeof input.json === "object" && input.json !== null) {
          const obj = input.json as Record<string, unknown>;
          if (Array.isArray(obj.features)) {
            for (const f of obj.features) {
              if (f && typeof f === "object") {
                const feature = f as Record<string, unknown>;
                if (typeof feature.name === "string") {
                  features.push({
                    name: feature.name,
                    value: typeof feature.value === "string" ? feature.value : null,
                    source: "productSpecification",
                    confidence: 0.9,
                  });
                }
              }
            }
          } else if (obj.specifications && typeof obj.specifications === "object") {
            features.push(...extractFromJsonSpec(obj.specifications as Record<string, unknown>, "productSpecification", 0.9));
          } else {
            features.push(...extractFromJsonSpec(obj, "metadata", 0.7));
          }
        }
      }
      if (input.text) {
        features.push(...extractFromText(input.text));
        features.push(...extractFromDescription(input.text));
      }
    } catch (error) {
      console.error("FeatureExtractor error:", error instanceof Error ? error.message : "Unknown error");
    }
    return dedupeFeatures(features);
  }
}

export const featureExtractor = new FeatureExtractor();
export { dedupeFeatures, extractFromHtmlTable, extractFromHtmlList, extractFromJsonSpec, extractFromText };
