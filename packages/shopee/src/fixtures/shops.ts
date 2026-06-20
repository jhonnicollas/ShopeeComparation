export interface ShopFixture {
  shopId: string;
  shopeeShopId: string;
  name: string;
  shopUrl: string;
  statusLabels: string[];
  primaryStatus: "MALL" | "OFFICIAL" | "STAR" | "STARPLUS" | "PREFERRED" | "REGULAR" | "UNKNOWN";
  rating: number;
  ratingCount: number;
  responseRate: number;
  responseTime: string;
  followerCount: number;
  productCount: number;
  joinedAgeText: string;
  location: string;
  confidenceScore: number;
}

export const shopFixtures: ShopFixture[] = [
  {
    shopId: "shop-001",
    shopeeShopId: "shopee-shop-001",
    name: "Omron Official Store",
    shopUrl: "https://shopee.co.id/shop-001",
    statusLabels: ["Mall", "Official Brand Store"],
    primaryStatus: "MALL",
    rating: 4.9,
    ratingCount: 12500,
    responseRate: 99,
    responseTime: "dalam 1 jam",
    followerCount: 45000,
    productCount: 120,
    joinedAgeText: "5 tahun",
    location: "DKI Jakarta",
    confidenceScore: 1.0,
  },
  {
    shopId: "shop-002",
    shopeeShopId: "shopee-shop-002",
    name: "Xiaomi Health Store",
    shopUrl: "https://shopee.co.id/shop-002",
    statusLabels: ["Star+", "Chat Fast"],
    primaryStatus: "STARPLUS",
    rating: 4.7,
    ratingCount: 8500,
    responseRate: 95,
    responseTime: "dalam 2 jam",
    followerCount: 22000,
    productCount: 85,
    joinedAgeText: "3 tahun",
    location: "DKI Jakarta",
    confidenceScore: 1.0,
  },
  {
    shopId: "shop-003",
    shopeeShopId: "shopee-shop-003",
    name: "Medical Pro Shop",
    shopUrl: "https://shopee.co.id/shop-003",
    statusLabels: ["Star"],
    primaryStatus: "STAR",
    rating: 4.6,
    ratingCount: 3200,
    responseRate: 92,
    responseTime: "dalam 3 jam",
    followerCount: 8500,
    productCount: 45,
    joinedAgeText: "4 tahun",
    location: "DKI Jakarta",
    confidenceScore: 1.0,
  },
  {
    shopId: "shop-004",
    shopeeShopId: "shopee-shop-004",
    name: "Health Mart",
    shopUrl: "https://shopee.co.id/shop-004",
    statusLabels: ["Preferred"],
    primaryStatus: "PREFERRED",
    rating: 4.5,
    ratingCount: 1500,
    responseRate: 88,
    responseTime: "dalam 6 jam",
    followerCount: 3200,
    productCount: 250,
    joinedAgeText: "2 tahun",
    location: "DKI Jakarta",
    confidenceScore: 1.0,
  },
];

export function findShopFixtureById(shopId: string): ShopFixture | null {
  return shopFixtures.find((s) => s.shopId === shopId) ?? null;
}

export function findShopFixtureByShopeeId(shopeeShopId: string): ShopFixture | null {
  return shopFixtures.find((s) => s.shopeeShopId === shopeeShopId) ?? null;
}
