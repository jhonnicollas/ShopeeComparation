import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductDetailPage } from "./ProductDetailPage.js";

let mockQueryData: unknown = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => {
    const href = params
      ? to.replace(/\$(\w+)/g, (_, key) => params[key] ?? "")
      : to;
    return <a href={href}>{children}</a>;
  },
  useParams: () => ({}),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
  }),
}));

describe("ProductDetailPage", () => {
  const mockProduct = {
    id: "p_1",
    shopeeItemId: "123",
    shopeeShopId: "456",
    title: "Test Laptop",
    brand: "TestBrand",
    category: "Electronics",
    originalUrl: "https://shopee.co.id/product/456/123",
    canonicalUrl: null,
    imageUrl: "https://example.com/img.jpg",
    priceMin: 5000000,
    priceMax: 7000000,
    priceBeforeDiscount: 8000000,
    discountText: "25%",
    rating: 4.5,
    reviewCount: 100,
    soldCount: 500,
    favoriteCount: 200,
    stock: 50,
    shippedFrom: "DKI Jakarta",
    description: "A great laptop",
    confidenceScore: 0.85,
    lastCheckedAt: "2026-06-20T10:00:00Z",
    createdAt: "2026-06-20T09:00:00Z",
    updatedAt: "2026-06-20T10:00:00Z",
  };

  it("renders loading state", () => {
    mockIsLoading = true;
    mockIsError = false;
    mockQueryData = undefined;
    render(<ProductDetailPage productId="p_1" />);
    expect(screen.getByText("Loading product details...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockIsLoading = false;
    mockIsError = true;
    mockQueryData = undefined;
    render(<ProductDetailPage productId="p_1" />);
    expect(screen.getByText("Failed to load product details")).toBeInTheDocument();
  });

  it("renders product details", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = mockProduct;
    render(<ProductDetailPage productId="p_1" />);
    expect(screen.getByText("Test Laptop")).toBeInTheDocument();
    expect(screen.getByText(/Confidence/)).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("renders shop link", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = mockProduct;
    render(<ProductDetailPage productId="p_1" />);
    expect(screen.getByText("View Shop")).toHaveAttribute("href", "/shops/456");
  });
});
