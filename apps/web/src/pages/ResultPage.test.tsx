import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultPage } from "./ResultPage.js";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ researchSessionId: "rsr_test" }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";

const mockUseQuery = vi.mocked(useQuery);

describe("ResultPage", () => {
  it("renders the result page title", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ResultPage />);
    expect(screen.getByText(/Loading results/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ResultPage />);
    expect(screen.getByText(/Loading results/)).toBeInTheDocument();
  });

  it("shows error when session not found", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ResultPage />);
    expect(screen.getByText("Session not found")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    mockUseQuery.mockReturnValue({
      data: { comparison: null, items: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ResultPage />);
    expect(screen.getByText(/No comparison items yet/)).toBeInTheDocument();
  });
});
