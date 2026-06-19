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
    expect(screen.getByText(/Top 2 for "tensimeter"/)).toBeInTheDocument();
    expect(screen.getByText(/Shipped from:/)).toBeInTheDocument();
  });

  it("shows best product callout", () => {
    setupMock();
    render(<ResultPage />);
    expect(screen.getByText(/Best Product/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 0.95/)).toBeInTheDocument();
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
    expect(screen.getByText(/Best Value:/)).toBeInTheDocument();
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
    expect(screen.getByText("Missing Data Notes")).toBeInTheDocument();
    expect(screen.getByText(/Weight for item-1 not available/)).toBeInTheDocument();
  });
});
