import type { ProductSnapshot, ShopSnapshot, DataQualityField } from "@shopee-research/shared";
import { chat } from "../nineRouter/client.js";
import { checkDataQuality } from "@shopee-research/core";

export interface DataQualityInput {
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

export interface DataQualityOutput {
  traditionalFields: Array<DataQualityField & { fieldName: string }>;
  aiMissingNotes: string[];
}

const QUALITY_PROMPT = `Analyze the following product data for any missing or suspicious information.
Return JSON: {"missingNotes": ["note1", "note2"]}

Product:
{PRODUCT_JSON}
`;

export async function checkAiDataQuality(
  db: D1Database,
  env: Record<string, string | undefined>,
  input: DataQualityInput
): Promise<DataQualityOutput> {
  const traditionalFields = checkDataQuality(input);
  let aiMissingNotes: string[] = [];
  try {
    const prompt = QUALITY_PROMPT.replace(
      "{PRODUCT_JSON}",
      JSON.stringify(
        {
          title: input.product.title,
          brand: input.product.brand,
          description: input.product.description,
          specificationJson: input.product.specificationJson,
          weight: input.product.weight,
          shopName: input.shop?.name,
        },
        null,
        2
      )
    );
    const response = await chat(db, env, {
      prompt,
      providerKey: "9router",
      modelKey: "fast",
      jsonMode: true,
      temperature: 0.2,
    });
    const parsed = JSON.parse(response.text) as { missingNotes: string[] };
    aiMissingNotes = parsed.missingNotes ?? [];
  } catch {
    aiMissingNotes = [];
  }
  return {
    traditionalFields,
    aiMissingNotes,
  };
}
