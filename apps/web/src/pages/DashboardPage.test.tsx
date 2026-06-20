import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage.js";

let mockQueryData: unknown = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
  }),
}));

describe("DashboardPage", () => {
  it("renders loading state", () => {
    mockIsLoading = true;
    mockIsError = false;
    mockQueryData = undefined;
    render(<DashboardPage />);
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockIsLoading = false;
    mockIsError = true;
    mockQueryData = undefined;
    render(<DashboardPage />);
    expect(screen.getByText("Failed to load dashboard")).toBeInTheDocument();
  });

  it("renders empty state when no sessions", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = { items: [] };
    render(<DashboardPage />);
    expect(screen.getByText("Research Overview")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("No research sessions yet. Start one above.")).toBeInTheDocument();
  });

  it("renders stats and recent sessions", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = {
      items: [
        { id: "rsr_1", mode: "compareLinks", keyword: null, status: "completed", bestProductId: "p1", createdAt: "2026-06-20T10:00:00Z" },
        { id: "rsr_2", mode: "keywordSearch", keyword: "laptop", status: "failed", bestProductId: null, createdAt: "2026-06-20T11:00:00Z" },
      ],
    };
    render(<DashboardPage />);
    expect(screen.getByText("Research Overview")).toBeInTheDocument();
    const statCards = screen.getAllByText(/^\d+$/);
    expect(statCards.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("compareLinks")).toBeInTheDocument();
    expect(screen.getByText("laptop")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("renders quick action links", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = { items: [] };
    render(<DashboardPage />);
    expect(screen.getByText("Compare Links")).toHaveAttribute("href", "/compare");
    expect(screen.getByText("Keyword Search")).toHaveAttribute("href", "/keyword-search");
    expect(screen.getByText("Settings")).toHaveAttribute("href", "/settings/config");
  });
});
