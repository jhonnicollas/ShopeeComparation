import type { WeightExtraction } from "@shopee-research/shared";

export interface ExtractWeightInput {
  text: string;
  sourceContext?: string;
}

interface WeightMatch {
  value: number;
  unit: "gram" | "kg" | "mg" | "lb" | "oz";
  rawText: string;
  source: "productSpecification" | "description" | "metadata" | "variant" | "shipping" | "aiExtraction";
  confidence: number;
  index: number;
}

const GRAM_TO_GRAM = 1;
const KG_TO_GRAM = 1000;
const MG_TO_GRAM = 0.001;
const LB_TO_GRAM = 453.592;
const OZ_TO_GRAM = 28.3495;

function detectSource(context?: string): WeightMatch["source"] {
  if (!context) return "aiExtraction";
  const lower = context.toLowerCase();
  if (lower.includes("spec") || lower.includes("spesifikasi")) return "productSpecification";
  if (lower.includes("desc")) return "description";
  if (lower.includes("meta")) return "metadata";
  if (lower.includes("variant") || lower.includes("varian")) return "variant";
  if (lower.includes("ship") || lower.includes("kirim") || lower.includes("berat")) return "shipping";
  return "aiExtraction";
}

function toGrams(value: number, unit: WeightMatch["unit"]): number {
  switch (unit) {
    case "gram": return value * GRAM_TO_GRAM;
    case "kg": return value * KG_TO_GRAM;
    case "mg": return value * MG_TO_GRAM;
    case "lb": return value * LB_TO_GRAM;
    case "oz": return value * OZ_TO_GRAM;
  }
}

function fromGrams(grams: number): { value: number; unit: WeightMatch["unit"] } {
  if (grams >= 1000) return { value: Number((grams / 1000).toFixed(3)), unit: "kg" };
  if (grams < 1) return { value: Number((grams * 1000).toFixed(3)), unit: "mg" };
  return { value: Number(grams.toFixed(3)), unit: "gram" };
}const PATTERNS: Array<{ regex: RegExp; unit: WeightMatch["unit"]; confidence: number; needsKey?: RegExp }> = [
  {
    regex: /(\d+(?:[.,]\d+)?)\s*kg\b/gi,
    unit: "kg",
    confidence: 0.9,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*grams?\b/gi,
    unit: "gram",
    confidence: 0.9,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*\bgrams?\b/gi,
    unit: "gram",
    confidence: 0.9,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*mg\b/gi,
    unit: "mg",
    confidence: 0.9,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*lbs?\b/gi,
    unit: "lb",
    confidence: 0.85,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*oz\b/gi,
    unit: "oz",
    confidence: 0.85,
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*g\b/gi,
    unit: "gram",
    confidence: 0.8,
  },
  {
    regex: /berat["'\s:]+(\d+(?:[.,]\d+)?)\s*(g|gram|grams|kg|kgs|mg|mgs|lb|lbs|oz)/gi,
    unit: "gram",
    confidence: 0.95,
    needsKey: /berat/i,
  },
  {
    regex: /weight["'\s:]+(\d+(?:[.,]\d+)?)\s*(g|gram|grams|kg|kgs|mg|mgs|lb|lbs|oz)/gi,
    unit: "gram",
    confidence: 0.9,
    needsKey: /weight/i,
  },
];

function parseNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function findMatches(text: string): WeightMatch[] {
  const matches: WeightMatch[] = [];
  for (const pattern of PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      const valueText = match[1];
      const unitText = (match[2] ?? "").toLowerCase();
      if (!valueText) continue;
      const value = parseNumber(valueText);
      if (!Number.isFinite(value) || value <= 0) continue;
      let unit = pattern.unit;
      if (unitText === "g" || unitText === "gram") unit = "gram";
      else if (unitText === "kg") unit = "kg";
      else if (unitText === "mg") unit = "mg";
      else if (unitText === "lb" || unitText === "lbs") unit = "lb";
      else if (unitText === "oz") unit = "oz";
      matches.push({
        value,
        unit,
        rawText: match[0],
        source: "aiExtraction",
        confidence: pattern.confidence,
        index: match.index ?? 0,
      });
    }
  }
  return matches;
}

export class WeightExtractor {
  extractWeight(input: ExtractWeightInput): WeightExtraction {
    if (!input.text || input.text.trim().length === 0) {
      return { value: null, unit: null, rawText: null, source: null, confidence: 0 };
    }
    const matches = findMatches(input.text);
    if (matches.length === 0) {
      return { value: null, unit: null, rawText: null, source: null, confidence: 0 };
    }
    const source = detectSource(input.sourceContext);
    matches.forEach((m) => {
      m.source = source;
    });
    matches.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.index - b.index;
    });
    const best = matches[0];
    if (!best) {
      return { value: null, unit: null, rawText: null, source: null, confidence: 0 };
    }
    return {
      value: Number(best.value.toFixed(3)),
      unit: best.unit,
      rawText: best.rawText,
      source: best.source,
      confidence: best.confidence,
    };
  }
}export const weightExtractor = new WeightExtractor();
export { findMatches, toGrams, fromGrams, detectSource };
