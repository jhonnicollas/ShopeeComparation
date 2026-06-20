import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResearchDetailPage } from "./ResearchDetailPage.js";

let mockSessionData: unknown = undefined;
let mockComparisonData: unknown = undefined;
let mockAiReportData: unknown = undefined;
let mockSessionLoading = false;
let mockSessionError = false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => {
    const href = params ? to.replace(/\$researchSessionId/, params.researchSessionId) : to;
    return <a href={href}>{children}</a>;
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey as string[];
    if (key[1] === "session") {
      return { data: mockSessionData, isLoading: mockSessionLoading, isError: mockSessionError, error: null };
    }
    if (key[1] === "comparison") {
      return { data: mockComparisonData, isLoading: false, isError: false, error: null };
    }
    if (key[1] === "ai-report") {
      return { data: mockAiReportData, isLoading: false, isError: false, error: null };
    }
    return { data: undefined, isLoading: false, isError: false, error: null };
  },
}));

describe("ResearchDetailPage", () => {
  it("renders loading state", () => {
    mockSessionLoading = true;
    mockSessionError = false;
    mockSessionData = undefined;
    render(<ResearchDetailPage researchSessionId="rsr_1" />);
    expect(screen.getByText("Loading research details...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockSessionLoading = false;
    mockSessionError = true;
    mockSessionData = undefined;
    render(<ResearchDetailPage researchSessionId="rsr_1" />);
    expect(screen.getByText("Failed to load research details")).toBeInTheDocument();
  });

  it("renders session details", () => {
    mockSessionLoading = false;
    mockSessionError = false;
    mockSessionData = {
      researchSessionId: "rsr_1",
      mode: "keywordSearch",
      keyword: "laptop",
      shippedFrom: "DKI Jakarta",
      status: "completed",
      bestProductId: "p1",
      totalProducts: 10,
      completedProducts: 8,
      errorMessage: null,
      createdAt: "2026-06-20T10:00:00Z",
      updatedAt: "2026-06-20T10:05:00Z",
    };
    mockComparisonData = { comparison: null, items: [] };
    mockAiReportData = { report: null, rawText: null };
    render(<ResearchDetailPage researchSessionId="rsr_1" />);
    expect(screen.getByText("Keyword: laptop")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText(/DKI Jakarta/)).toBeInTheDocument();
    const allStatValues = screen.getAllByText(/^\d+$/);
    expect(allStatValues.length).toBeGreaterThanOrEqual(2);
  });

  it("renders comparison items", () => {
    mockSessionLoading = false;
    mockSessionError = false;
    mockSessionData = {
      researchSessionId: "rsr_1",
      mode: "keywordSearch",
      keyword: "laptop",
      shippedFrom: "DKI Jakarta",
      status: "completed",
      bestProductId: "p1",
      totalProducts: 5,
      completedProducts: 5,
      errorMessage: null,
      createdAt: "2026-06-20T10:00:00Z",
      updatedAt: "2026-06-20T10:05:00Z",
    };
    mockComparisonData = {
      comparison: { id: "cmp_1", researchSessionId: "rsr_1", title: "laptop", mode: "keywordSearch", bestProductId: "p1" },
      items: [
        { id: "ci_1", rank: 1, productId: "p1", shopId: "s1", finalScore: 0.85, ratingScore: 0.9, reviewCountScore: 0.8, soldCountScore: 0.7, priceScore: 0.8, shopTrustScore: 0.9, responseRateScore: 0.85, featureMatchScore: 0.8, riskPenalty: 0.05, prosJson: ["Good"], consJson: ["Expensive"], riskJson: [] },
      ],
    };
    mockAiReportData = { report: null, rawText: null };
    render(<ResearchDetailPage researchSessionId="rsr_1" />);
    expect(screen.getByText("Comparison Results")).toBeInTheDocument();
    expect(screen.getByText("0.85")).toBeInTheDocument();
  });
});
