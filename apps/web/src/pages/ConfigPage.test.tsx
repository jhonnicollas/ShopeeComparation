import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigPage } from "./ConfigPage.js";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

import { useQuery } from "@tanstack/react-query";

const mockUseQuery = vi.mocked(useQuery);

describe("ConfigPage", () => {
  it("renders the config page title", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ConfigPage />);
    expect(screen.getByRole("heading", { name: "Runtime Configuration" })).toBeInTheDocument();
  });

  it("renders all tabs", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ConfigPage />);
    expect(screen.getByRole("tab", { name: "App Configs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AI Providers" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AI Models" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Search Providers" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Scoring Configs" })).toBeInTheDocument();
  });

  it("shows loading state when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ConfigPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
