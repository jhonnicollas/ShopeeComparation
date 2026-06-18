import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiReportView } from "./AiReportView.js";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";

const mockUseQuery = vi.mocked(useQuery);

describe("AiReportView", () => {
  it("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<AiReportView comparisonId="cmp_1" />);
    expect(screen.getByText(/Loading AI report/)).toBeInTheDocument();
  });

  it("shows empty state when no report", () => {
    mockUseQuery.mockReturnValue({
      data: { report: null, rawText: null },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<AiReportView comparisonId="cmp_1" />);
    expect(screen.getByText(/AI report not yet available/)).toBeInTheDocument();
  });

  it("renders report content", () => {
    mockUseQuery.mockReturnValue({
      data: {
        report: {
          bestProductId: "item-1",
          bestProductName: "Test Product",
          ranking: [{ productId: "item-1", rank: 1, reason: "Best rating" }],
          valueForMoneyProductId: "item-1",
          safestProductId: "item-1",
          riskiestProductId: "item-2",
          prosCons: [
            { productId: "item-1", pros: ["High rating"], cons: ["Expensive"] },
          ],
          redFlags: [{ productId: "item-2", type: "low_stock", message: "Low stock" }],
          confidence: 0.85,
          missingDataNotes: ["Weight for item-2"],
        },
        rawText: "raw text",
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<AiReportView comparisonId="cmp_1" />);
    expect(screen.getByText("AI Recommendation Report")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/Best rating/)).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });
});
