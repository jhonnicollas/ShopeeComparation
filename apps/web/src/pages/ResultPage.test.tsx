import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultPage } from "./ResultPage.js";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ researchSessionId: "rsr_test" }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const sessionFixture = {
  researchSessionId: "rsr_test",
  mode: "keywordSearch",
  keyword: "tensimeter",
  shippedFrom: "DKI Jakarta",
  status: "completed",
  bestProductId: "item-1",
  totalProducts: 10,
  completedProducts: 10,
  errorMessage: null,
};

const productsFixture = {
  "item-1": {
    id: "item-1",
    shopeeItemId: "item-1",
    shopeeShopId: "shop-1",
    title: "Tensimeter Digital",
    brand: "Omron",
    category: "Medical",
    imageUrl: null,
    priceMin: 150000,
    priceMax: 200000,
    rating: 4.8,
    reviewCount: 1250,
    soldCount: 3500,
    shippedFrom: "DKI Jakarta",
    description: null,
    weight: { value: 500, unit: "gram", rawText: "500g" },
    features: [{ name: "Akurasi", value: "±3 mmHg" }],
    confidenceScore: 1.0,
  },
  "item-2": {
    id: "item-2",
    shopeeItemId: "item-2",
    shopeeShopId: "shop-2",
    title: "Tensimeter Bluetooth",
    brand: "Xiaomi",
    category: "Medical",
    imageUrl: null,
    priceMin: 85000,
    priceMax: 120000,
    rating: 4.5,
    reviewCount: 850,
    soldCount: 2100,
    shippedFrom: "DKI Jakarta",
    description: null,
    weight: { value: 400, unit: "gram", rawText: "400g" },
    features: [{ name: "Bluetooth", value: "5.0" }],
    confidenceScore: 1.0,
  },
};

const shopsFixture = {
  "shop-1": {
    id: "shop-1",
    shopeeShopId: "shop-1",
    name: "Omron Official",
    shopUrl: null,
    statusLabels: ["OFFICIAL"],
    primaryStatus: "OFFICIAL",
    rating: 4.9,
    ratingCount: 5000,
    responseRate: 98,
    responseTime: "< 1 jam",
    followerCount: 100000,
    productCount: 200,
    joinedAgeText: "5 tahun",
    location: "DKI Jakarta",
  },
  "shop-2": {
    id: "shop-2",
    shopeeShopId: "shop-2",
    name: "Xiaomi Store",
    shopUrl: null,
    statusLabels: ["MALL"],
    primaryStatus: "MALL",
    rating: 4.7,
    ratingCount: 3000,
    responseRate: 95,
    responseTime: "< 2 jam",
    followerCount: 50000,
    productCount: 500,
    joinedAgeText: "3 tahun",
    location: "DKI Jakarta",
  },
};

const comparisonFixture = {
  comparison: {
    id: "cmp_test",
    researchSessionId: "rsr_test",
    title: null,
    mode: "keywordSearch",
    bestProductId: "item-1",
  },
  items: [
    {
      id: "cim_1",
      rank: 1,
      productId: "item-1",
      shopId: "shop-1",
      finalScore: 0.95,
      ratingScore: 0.9,
      reviewCountScore: 0.85,
      soldCountScore: 0.8,
      priceScore: 0.75,
      shopTrustScore: 0.9,
      responseRateScore: 0.7,
      featureMatchScore: 0.6,
      riskPenalty: 0,
      prosJson: ["High rating", "Many reviews"],
      consJson: ["Expensive"],
      riskJson: null,
    },
    {
      id: "cim_2",
      rank: 2,
      productId: "item-2",
      shopId: "shop-2",
      finalScore: 0.8,
      ratingScore: 0.75,
      reviewCountScore: 0.7,
      soldCountScore: 0.65,
      priceScore: 0.8,
      shopTrustScore: 0.75,
      responseRateScore: 0.65,
      featureMatchScore: 0.5,
      riskPenalty: 0,
      prosJson: ["Good price"],
      consJson: null,
      riskJson: null,
    },
  ],
  products: productsFixture,
  shops: shopsFixture,
};

const aiReportFixture = {
  report: {
    bestProductId: "item-1",
    bestProductName: "Top Tensimeter",
    ranking: [
      { productId: "item-1", rank: 1, reason: "Best overall" },
      { productId: "item-2", rank: 2, reason: "Best value" },
    ],
    valueForMoneyProductId: "item-2",
    safestProductId: "item-1",
    riskiestProductId: null,
    prosCons: [],
    redFlags: [],
    confidence: 0.85,
    missingDataNotes: ["Weight for item-1 not available"],
  },
  rawText: null,
};

function setupMock({
  session = sessionFixture,
  comparison = comparisonFixture,
  aiReport = aiReportFixture,
  sessionLoading = false,
  comparisonLoading = false,
}: {
  session?: unknown;
  comparison?: unknown;
  aiReport?: unknown;
  sessionLoading?: boolean;
  comparisonLoading?: boolean;
} = {}) {
  mockUseQuery.mockImplementation((opts: { queryKey?: unknown[] }) => {
    const key = opts?.queryKey;
    if (Array.isArray(key) && key[0] === "session") {
      return { data: session, isLoading: sessionLoading, error: null };
    }
    if (Array.isArray(key) && key[0] === "comparison") {
      return { data: comparison, isLoading: comparisonLoading, error: null };
    }
    if (Array.isArray(key) && key[0] === "ai-report") {
      return { data: aiReport, isLoading: false, error: null };
    }
    return { data: undefined, isLoading: false, error: null };
  });
}
describe("ResultPage", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("renders loading state when session is loading", () => {
    setupMock({ sessionLoading: true });
    render(<ResultPage />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("renders the keyword search result page", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText(/Top 2 untuk "tensimeter"/)).toBeInTheDocument();
    expect(screen.getByText(/Dikirim dari:/)).toBeInTheDocument();
  });

  it("shows best product callout", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getAllByText(/Produk Terbaik/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Skor: 95\.0/)).toBeInTheDocument();
  });

  it("renders all ranked products", () => {
    setupMock();
    render(<ResultPage />);
    const badges = screen.getAllByText("#1");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows AI report section", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("AI Recommendation")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "Confidence: 85%")).toBeInTheDocument();
    expect(screen.getAllByText(/Produk Terbaik:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Value-for-Money:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Paling Aman:/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows pros and cons", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("High rating")).toBeInTheDocument();
    expect(screen.getByText("Expensive")).toBeInTheDocument();
    expect(screen.getByText("Good price")).toBeInTheDocument();
  });

  it("shows missing data notes", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText(/Weight for item-1 not available/)).toBeInTheDocument();
  });

  it("shows comparison table with all PRD-required fields", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("Tabel Perbandingan Produk")).toBeInTheDocument();
    expect(screen.getAllByText("Tensimeter Digital").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Omron Official").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("OFFICIAL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rp 150.000")).toBeInTheDocument();
    expect(screen.getByText(/4\.8 \/ 5/)).toBeInTheDocument();
  });

  it("shows shop comparison table", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("Tabel Perbandingan Toko")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText(/< 1 jam/)).toBeInTheDocument();
    expect(screen.getByText(/< 2 jam/)).toBeInTheDocument();
  });

  it("shows weight comparison table", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("Tabel Perbandingan Berat")).toBeInTheDocument();
    expect(screen.getAllByText("500").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("400").length).toBeGreaterThanOrEqual(1);
  });

  it("shows feature comparison table", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText("Tabel Perbandingan Fitur")).toBeInTheDocument();
    expect(screen.getByText(/Akurasi: ±3 mmHg/)).toBeInTheDocument();
    expect(screen.getByText(/Bluetooth: 5\.0/)).toBeInTheDocument();
  });
});