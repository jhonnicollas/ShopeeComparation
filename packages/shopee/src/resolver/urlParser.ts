export interface ParseUrlInput {
  url: string;
}

export interface ParseUrlResult {
  isValid: boolean;
  isShopeeHost: boolean;
  isShortUrl: boolean;
  shopId: string | null;
  itemId: string | null;
  normalizedUrl: string | null;
  error?: string;
}

const SHOPEE_HOSTS = [
  "shopee.co.id",
  "shopee.com.my",
  "shopee.sg",
  "shopee.co.th",
  "shopee.tw",
  "shopee.ph",
  "shopee.vn",
  "shopee.com.br",
  "shopee.com.mx",
];

export function parseShopeeUrl(input: ParseUrlInput): ParseUrlResult {
  const { url } = input;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      isValid: false,
      isShopeeHost: false,
      isShortUrl: false,
      shopId: null,
      itemId: null,
      normalizedUrl: null,
      error: "Invalid URL format",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isShopeeHost = SHOPEE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  const isShortUrl = hostname === "shp.ee" || hostname === "id.shp.ee";

  let shopId: string | null = null;
  let itemId: string | null = null;

  if (isShopeeHost) {
    itemId = parsed.searchParams.get("item_id");
    if (!itemId) {
      const pathMatch = parsed.pathname.match(/\.?i?\.?(\d+)\.(\d+)/);
      if (pathMatch) {
        shopId = pathMatch[1] ?? null;
        itemId = pathMatch[2] ?? null;
      }
    }
    if (!shopId) {
      const shopMatch = parsed.pathname.match(/^\/?shop\/(\d+)/);
      if (shopMatch) {
        shopId = shopMatch[1] ?? null;
      }
    }
  }

  let normalizedUrl: string | null = null;
  if (itemId && shopId) {
    normalizedUrl = `https://shopee.co.id/product/${shopId}/${itemId}`;
  } else if (itemId) {
    normalizedUrl = `https://shopee.co.id/product/-/i${itemId}.${itemId}`;
  }

  return {
    isValid: true,
    isShopeeHost,
    isShortUrl,
    shopId,
    itemId,
    normalizedUrl,
  };
}
