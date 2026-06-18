import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResolverDiagnostics } from "./ResolverDiagnostics.js";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../lib/shopee.js", () => ({
  resolveShopeeUrl: vi.fn(),
}));

import { useQuery } from "@tanstack/react-query";

const mockUseQuery = vi.mocked(useQuery);

describe("ResolverDiagnostics", () => {
  it("renders nothing when no url provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    const { container } = render(<ResolverDiagnostics url="" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    render(<ResolverDiagnostics url="https://shopee.co.id/p1" />);
    expect(screen.getByText(/Resolving URL/)).toBeInTheDocument();
  });

  it("shows error state when query fails", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    } as unknown as ReturnType<typeof useQuery>);
    const { container } = render(<ResolverDiagnostics url="https://shopee.co.id/p1" />);
    expect(container.textContent).toContain("Failed to resolve URL");
  });

  it("renders resolved result with diagnostics", () => {
    mockUseQuery.mockReturnValue({
      data: {
        originalUrl: "https://shopee.co.id/Test-i.123.456",
        finalUrl: "https://shopee.co.id/Test-i.123.456",
        canonicalUrl: "https://shopee.co.id/product/123/456",
        shopId: "123",
        itemId: "456",
        resolveMethod: "manual",
        status: "resolved",
        errorMessage: null,
        diagnostics: {
          adapterUsed: "direct",
          attempts: [
            {
              adapter: "direct",
              resolveMethod: "manual",
              status: "resolved",
              durationMs: 5,
            },
          ],
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    const { container } = render(<ResolverDiagnostics url="https://shopee.co.id/Test-i.123.456" />);
    expect(container.textContent).toContain("Resolved");
    expect(container.textContent).toContain("direct");
    expect(container.textContent).toContain("123");
    expect(container.textContent).toContain("456");
  });

  it("renders failed result with error message", () => {
    mockUseQuery.mockReturnValue({
      data: {
        originalUrl: "https://id.shp.ee/abc",
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "manual",
        status: "failed",
        errorMessage: "All adapters failed",
        diagnostics: {
          adapterUsed: "none",
          attempts: [
            { adapter: "direct", resolveMethod: "manual", status: "failed", errorMessage: "Invalid URL", durationMs: 1 },
            { adapter: "redirect", resolveMethod: "redirect", status: "failed", errorMessage: "Network error", durationMs: 2 },
          ],
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    const { container } = render(<ResolverDiagnostics url="https://id.shp.ee/abc" />);
    expect(container.textContent).toContain("Failed");
    expect(container.textContent).toContain("All adapters failed");
  });

  it("sanitizes secrets from error messages", () => {
    mockUseQuery.mockReturnValue({
      data: {
        originalUrl: "https://id.shp.ee/abc",
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "manual",
        status: "failed",
        errorMessage: "Failed: api_key=secret12345 token=bearer-abc",
        diagnostics: {
          adapterUsed: "none",
          attempts: [],
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuery>);
    const { container } = render(<ResolverDiagnostics url="https://id.shp.ee/abc" />);
    expect(container.textContent).not.toContain("secret12345");
    expect(container.textContent).not.toContain("bearer-abc");
    expect(container.textContent).toContain("[REDACTED]");
  });
});
