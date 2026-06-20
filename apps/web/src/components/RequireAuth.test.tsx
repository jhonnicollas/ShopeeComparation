import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "./RequireAuth.js";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../lib/auth.js", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../lib/auth.js";

const mockUseAuth = vi.mocked(useAuth);

describe("RequireAuth", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "usr_1", email: "user@example.com", name: "User", role: "user" },
      isLoading: false,
      isAuthenticated: true,
      isError: false,
    });
    render(
      <RequireAuth>
        <div>Protected content</div>
      </RequireAuth>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("shows loading state while checking auth", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isError: false,
    });
    render(
      <RequireAuth>
        <div>Protected content</div>
      </RequireAuth>
    );
    expect(screen.getByText(/Checking authentication/)).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders nothing when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isError: false,
    });
    const { container } = render(
      <RequireAuth>
        <div>Protected content</div>
      </RequireAuth>
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(container.innerHTML).toBe("");
  });
});
