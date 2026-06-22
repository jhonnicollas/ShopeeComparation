import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminUsersPage } from "./AdminUsersPage.js";

const mockApiRequest = vi.fn();
vi.mock("../lib/api.js", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [k: string]: unknown }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  createRoute: vi.fn(),
  createRootRoute: vi.fn(),
  createRouter: vi.fn(),
  Outlet: () => null,
}));

function renderWithProviders() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const StubRouter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return render(
    <QueryClientProvider client={qc}>
      <StubRouter>
        <AdminUsersPage />
      </StubRouter>
    </QueryClientProvider>
  );
}

const SAMPLE_USERS = [
  {
    id: "usr_admin",
    email: "admin@shopee-research.local",
    name: "Admin",
    role: "admin",
    status: "active",
    createdAt: "2026-06-21T13:00:00Z",
    updatedAt: "2026-06-21T13:00:00Z",
    activeSessionCount: 2,
    researchSessionCount: 5,
  },
  {
    id: "usr_test",
    email: "test@example.com",
    name: "Test User",
    role: "user",
    status: "disabled",
    createdAt: "2026-06-20T13:00:00Z",
    updatedAt: "2026-06-21T13:00:00Z",
    activeSessionCount: 0,
    researchSessionCount: 1,
  },
];

beforeEach(() => {
  mockApiRequest.mockReset();
});

describe("AdminUsersPage", () => {
  it("shows loading state initially", () => {
    mockApiRequest.mockReturnValue(new Promise(() => {}));
    renderWithProviders();
    expect(screen.getByText(/loading users/i)).toBeTruthy();
  });

  it("renders user rows with email, role, status", async () => {
    mockApiRequest.mockResolvedValue({ items: SAMPLE_USERS });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText("admin@shopee-research.local")).toBeTruthy();
      expect(screen.getByText("test@example.com")).toBeTruthy();
    });
    expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("user").length).toBeGreaterThan(0);
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.getByText("disabled")).toBeTruthy();
  });

  it("shows Disable button for active users, Enable for disabled", async () => {
    mockApiRequest.mockResolvedValue({ items: SAMPLE_USERS });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText("admin@shopee-research.local")).toBeTruthy();
    });
    const adminRow = screen.getByTestId("admin-user-row-usr_admin");
    const testRow = screen.getByTestId("admin-user-row-usr_test");
    expect(adminRow.querySelector("button")?.textContent).toBe("Disable");
    expect(testRow.querySelector("button")?.textContent).toBe("Enable");
  });

  it("shows error state when API fails", async () => {
    mockApiRequest.mockRejectedValue(new Error("Network down"));
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/gagal memuat data user/i)).toBeTruthy();
    });
  });

  it("renders 0 user message when list is empty", async () => {
    mockApiRequest.mockResolvedValue({ items: [] });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/0 user terdaftar/i)).toBeTruthy();
    });
  });

  it("renders session and research counts", async () => {
    mockApiRequest.mockResolvedValue({ items: SAMPLE_USERS });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText("admin@shopee-research.local")).toBeTruthy();
    });
    const cells = screen.getAllByRole("cell");
    expect(cells.some((c) => c.textContent === "2")).toBe(true);
    expect(cells.some((c) => c.textContent === "0")).toBe(true);
  });
});
