import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShopDetailPage } from "./ShopDetailPage.js";

let mockQueryData: unknown = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
  }),
}));

describe("ShopDetailPage", () => {
  const mockShop = {
    id: "s_1",
    shopeeShopId: "456",
    name: "Test Shop",
    shopUrl: "https://shopee.co.id/testshop",
    statusJson: ["MALL", "STAR"],
    primaryStatus: "MALL",
    rating: 4.8,
    ratingCount: 500,
    responseRate: 95,
    responseTime: "within hours",
    followerCount: 10000,
    productCount: 200,
    joinedAgeText: "5 years",
    location: "DKI Jakarta",
    confidenceScore: 0.9,
    lastCheckedAt: "2026-06-20T10:00:00Z",
    createdAt: "2026-06-20T09:00:00Z",
    updatedAt: "2026-06-20T10:00:00Z",
  };

  it("renders loading state", () => {
    mockIsLoading = true;
    mockIsError = false;
    mockQueryData = undefined;
    render(<ShopDetailPage shopId="s_1" />);
    expect(screen.getByText("Loading shop details...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockIsLoading = false;
    mockIsError = true;
    mockQueryData = undefined;
    render(<ShopDetailPage shopId="s_1" />);
    expect(screen.getByText("Failed to load shop details")).toBeInTheDocument();
  });

  it("renders shop details", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = mockShop;
    render(<ShopDetailPage shopId="s_1" />);
    expect(screen.getByText("Test Shop")).toBeInTheDocument();
    expect(screen.getByText("MALL")).toBeInTheDocument();
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    expect(screen.getByText("5 years")).toBeInTheDocument();
  });
});
