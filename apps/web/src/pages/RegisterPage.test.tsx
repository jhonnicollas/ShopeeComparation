import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegisterPage } from "./RegisterPage.js";

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
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe("RegisterPage", () => {
  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
  });

  it("renders email, name, and password fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("renders the login link", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows password hint", () => {
    render(<RegisterPage />);
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument();
  });
});
