export interface ProductFixture {
  itemId: string;
  shopId: string;
  originalUrl: string;
  title: string;
  brand: string;
  category: string;
  priceMin: number;
  priceMax: number;
  priceBeforeDiscount: number | null;
  discountText: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  favoriteCount: number;
  stock: number;
  shippedFrom: string;
  imageUrl: string;
  galleryJson: string[];
  description: string;
  specificationJson: Record<string, unknown>;
  weight: {
    value: number;
    unit: string;
    rawText: string;
    source: string;
    confidence: number;
  };
  features: Array<{
    name: string;
    value: string;
    source: string;
    confidence: number;
  }>;
  source: string;
  confidenceScore: number;
}

const galleryToJson = (items: string[]): string[] => items;
const specToJson = (spec: Record<string, unknown>): Record<string, unknown> => spec;

export const productFixtures: ProductFixture[] = [
  {
    itemId: "item-001",
    shopId: "shop-001",
    originalUrl: "https://shopee.co.id/product-1",
    brand: "Omron",
    category: "Medical",
    title: "Tensimeter Digital Profesional Akurat",
    priceMin: 125000,
    priceMax: 185000,
    priceBeforeDiscount: 250000,
    discountText: "50%",
    rating: 4.8,
    reviewCount: 1250,
    soldCount: 3500,
    favoriteCount: 890,
    stock: 50,
    shippedFrom: "DKI Jakarta",
    imageUrl: "https://example.com/img1.jpg",
    galleryJson: galleryToJson(["https://example.com/img1-1.jpg", "https://example.com/img1-2.jpg"]),
    description: "Tensimeter digital dengan akurasi tinggi, cocok untuk penggunaan klinis dan rumah.",
    specificationJson: specToJson({
      brand: "Omron",
      type: "Digital",
      warranty: "2 tahun",
    }),
    weight: {
      value: 500,
      unit: "gram",
      rawText: "500g",
      source: "fixture",
      confidence: 1.0,
    },
    features: [
      { name: "Akurasi", value: "±3 mmHg", source: "fixture", confidence: 1.0 },
      { name: "Memory", value: "60 pembacaan", source: "fixture", confidence: 1.0 },
      { name: "Baterai", value: "AA x4", source: "fixture", confidence: 1.0 },
    ],
    source: "fixture",
    confidenceScore: 1.0,
  },
  {
    itemId: "item-002",
    shopId: "shop-002",
    originalUrl: "https://shopee.co.id/product-2",
    brand: "Xiaomi",
    category: "Medical",
    title: "Tensimeter Digital Bluetooth Murah",
    priceMin: 85000,
    priceMax: 120000,
    priceBeforeDiscount: 150000,
    discountText: "30%",
    rating: 4.5,
    reviewCount: 850,
    soldCount: 2100,
    favoriteCount: 450,
    stock: 100,
    shippedFrom: "DKI Jakarta",
    imageUrl: "https://example.com/img2.jpg",
    galleryJson: galleryToJson(["https://example.com/img2-1.jpg"]),
    description: "Tensimeter digital dengan koneksi Bluetooth untuk smartphone.",
    specificationJson: specToJson({
      brand: "Xiaomi",
      type: "Digital Bluetooth",
    }),
    weight: {
      value: 400,
      unit: "gram",
      rawText: "400g",
      source: "fixture",
      confidence: 1.0,
    },
    features: [
      { name: "Akurasi", value: "±5 mmHg", source: "fixture", confidence: 1.0 },
      { name: "Koneksi", value: "Bluetooth 5.0", source: "fixture", confidence: 1.0 },
    ],
    source: "fixture",
    confidenceScore: 1.0,
  },
  {
    itemId: "item-003",
    shopId: "shop-003",
    originalUrl: "https://shopee.co.id/product-3",
    brand: "Riester",
    category: "Medical",
    title: "Tensimeter Aneroid Manual Classic",
    priceMin: 95000,
    priceMax: 145000,
    priceBeforeDiscount: 180000,
    discountText: "30%",
    rating: 4.6,
    reviewCount: 420,
    soldCount: 980,
    favoriteCount: 230,
    stock: 30,
    shippedFrom: "DKI Jakarta",
    imageUrl: "https://example.com/img3.jpg",
    galleryJson: galleryToJson([]),
    description: "Tensimeter manual tipe aneroid, cocok untuk profesional medis.",
    specificationJson: specToJson({
      brand: "Riester",
      type: "Aneroid",
    }),
    weight: {
      value: 800,
      unit: "gram",
      rawText: "800g",
      source: "fixture",
      confidence: 1.0,
    },
    features: [
      { name: "Tipe", value: "Aneroid Manual", source: "fixture", confidence: 1.0 },
      { name: "Akurasi", value: "±2 mmHg", source: "fixture", confidence: 1.0 },
    ],
    source: "fixture",
    confidenceScore: 1.0,
  },
  {
    itemId: "item-004",
    shopId: "shop-001",
    originalUrl: "https://shopee.co.id/product-4",
    brand: "Omron",
    category: "Medical",
    title: "Tensimeter Digital Premium Garansi Resmi",
    priceBeforeDiscount: null,
    discountText: null,
    priceMin: 350000,
    priceMax: 480000,
    rating: 4.9,
    reviewCount: 320,
    soldCount: 650,
    favoriteCount: 180,
    stock: 15,
    shippedFrom: "DKI Jakarta",
    imageUrl: "https://example.com/img4.jpg",
    galleryJson: galleryToJson(["https://example.com/img4-1.jpg", "https://example.com/img4-2.jpg", "https://example.com/img4-3.jpg"]),
    description: "Tensimeter premium dengan garansi resmi 3 tahun.",
    specificationJson: specToJson({
      brand: "Omron",
      type: "Digital Premium",
      warranty: "3 tahun",
    }),
    weight: {
      value: 600,
      unit: "gram",
      rawText: "600g",
      source: "fixture",
      confidence: 1.0,
    },
    features: [
      { name: "Akurasi", value: "±2 mmHg", source: "fixture", confidence: 1.0 },
      { name: "Memory", value: "100 pembacaan", source: "fixture", confidence: 1.0 },
      { name: "Koneksi", value: "Bluetooth + USB", source: "fixture", confidence: 1.0 },
    ],
    source: "fixture",
    confidenceScore: 1.0,
  },
  {
    itemId: "item-005",
    shopId: "shop-004",
    originalUrl: "https://shopee.co.id/product-5",
    brand: "Generic",
    category: "Medical",
    title: "Tensimeter Digital Ekonomis",
    priceBeforeDiscount: null,
    discountText: null,
    priceMin: 65000,
    priceMax: 95000,
    rating: 4.2,
    reviewCount: 180,
    soldCount: 450,
    favoriteCount: 90,
    stock: 200,
    shippedFrom: "DKI Jakarta",
    imageUrl: "https://example.com/img5.jpg",
    galleryJson: galleryToJson([]),
    description: "Tensimeter ekonomis untuk penggunaan rumah tangga.",
    specificationJson: specToJson({
      brand: "Generic",
      type: "Digital Basic",
    }),
    weight: {
      value: 350,
      unit: "gram",
      rawText: "350g",
      source: "fixture",
      confidence: 1.0,
    },
    features: [
      { name: "Akurasi", value: "±5 mmHg", source: "fixture", confidence: 1.0 },
      { name: "Display", value: "LCD Digital", source: "fixture", confidence: 1.0 },
    ],
    source: "fixture",
    confidenceScore: 1.0,
  },
];

export function findFixtureByItemId(itemId: string): ProductFixture | null {
  return productFixtures.find((p) => p.itemId === itemId) ?? null;
}

export function findFixtureByUrl(url: string): ProductFixture | null {
  return productFixtures.find((p) => p.originalUrl === url) ?? null;
}
