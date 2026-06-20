import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistoryPage } from "./HistoryPage.js";

let mockQueryData: unknown = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => {
    const href = params ? to.replace(/\$researchSessionId/, params.researchSessionId) : to;
    return <a href={href}>{children}</a>;
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
  }),
}));

describe("HistoryPage", () => {
  it("renders loading state", () => {
    mockIsLoading = true;
    mockIsError = false;
    mockQueryData = undefined;
    render(<HistoryPage />);
    expect(screen.getByText("Loading history...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockIsLoading = false;
    mockIsError = true;
    mockQueryData = undefined;
    render(<HistoryPage />);
    expect(screen.getByText("Failed to load history")).toBeInTheDocument();
  });

  it("renders empty state when no sessions", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = { items: [] };
    render(<HistoryPage />);
    expect(screen.getByText("Research History")).toBeInTheDocument();
    expect(screen.getByText("No research sessions yet.")).toBeInTheDocument();
  });

  it("renders sessions list", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = {
      items: [
        { id: "rsr_1", mode: "compareLinks", keyword: null, status: "completed", bestProductId: "p1", createdAt: "2026-06-20T10:00:00Z" },
        { id: "rsr_2", mode: "keywordSearch", keyword: "laptop", status: "failed", bestProductId: null, createdAt: "2026-06-20T11:00:00Z" },
      ],
    };
    render(<HistoryPage />);
    expect(screen.getByText("Research History")).toBeInTheDocument();
    expect(screen.getByText("compareLinks")).toBeInTheDocument();
    expect(screen.getByText("laptop")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("View")).toHaveAttribute("href", "/results/rsr_1");
  });
});
