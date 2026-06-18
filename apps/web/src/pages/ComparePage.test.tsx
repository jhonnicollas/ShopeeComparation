import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComparePage } from "./ComparePage.js";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useQuery: () => ({
    data: undefined,
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

describe("ComparePage", () => {
  it("renders the compare page", () => {
    render(<ComparePage />);
    expect(screen.getByRole("heading", { name: "Compare Links" })).toBeInTheDocument();
  });

  it("renders initial link input", () => {
    render(<ComparePage />);
    expect(screen.getByLabelText("Link 1")).toBeInTheDocument();
  });

  it("renders the compare button", () => {
    render(<ComparePage />);
    expect(screen.getByRole("button", { name: "Compare" })).toBeInTheDocument();
  });

  it("renders the add link button", () => {
    render(<ComparePage />);
    expect(screen.getByRole("button", { name: "+ Add Link" })).toBeInTheDocument();
  });
});
