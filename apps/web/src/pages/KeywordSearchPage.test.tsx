import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeywordSearchPage } from "./KeywordSearchPage.js";

const mockNavigate = vi.fn();
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn((opts: { onSuccess?: (data: unknown) => void; onError?: (err: unknown) => void }) => ({
    mutate: (input: unknown) => {
      mockMutate(input);
      if (input && typeof input === "object" && "keyword" in input) {
        setTimeout(() => {
          opts.onSuccess?.({
            jobId: "job_test",
            researchSessionId: "rsr_test",
            status: "pending",
          });
        }, 0);
      }
    },
    isPending: false,
  })),
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("KeywordSearchPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
    mockInvalidateQueries.mockClear();
  });

  it("renders all form fields with defaults", () => {
    render(<KeywordSearchPage />);
    expect(screen.getByLabelText(/Keyword/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Shipped From/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Limit/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price Min/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price Max/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum Rating/)).toBeInTheDocument();
    expect(screen.getByText(/Store Status/)).toBeInTheDocument();
  });

  it("defaults shippedFrom to DKI Jakarta and limit to 10", () => {
    render(<KeywordSearchPage />);
    const shippedFrom = screen.getByLabelText(/Shipped From/) as HTMLInputElement;
    const limit = screen.getByLabelText(/Limit/) as HTMLInputElement;
    expect(shippedFrom.value).toBe("DKI Jakarta");
    expect(limit.value).toBe("10");
  });

  it("shows error when keyword is empty", async () => {
    const user = userEvent.setup();
    render(<KeywordSearchPage />);
    const button = screen.getByRole("button", { name: /Search/ });
    await user.click(button);
    expect(screen.getByText(/Keyword is required/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits correct payload with defaults", async () => {
    const user = userEvent.setup();
    render(<KeywordSearchPage />);
    await user.type(screen.getByLabelText(/Keyword/), "tensimeter");
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(mockMutate).toHaveBeenCalledWith({
      keyword: "tensimeter",
      shippedFrom: "DKI Jakarta",
      limit: 10,
      priceMin: null,
      priceMax: null,
      minimumRating: null,
      storeStatus: [],
    });
  });

  it("toggles store status checkboxes", async () => {
    const user = userEvent.setup();
    render(<KeywordSearchPage />);
    const mallCheckbox = screen.getByLabelText("MALL") as HTMLInputElement;
    const starCheckbox = screen.getByLabelText("STAR") as HTMLInputElement;
    expect(mallCheckbox.checked).toBe(false);
    await user.click(mallCheckbox);
    expect(mallCheckbox.checked).toBe(true);
    await user.click(starCheckbox);
    expect(starCheckbox.checked).toBe(true);
    await user.click(mallCheckbox);
    expect(mallCheckbox.checked).toBe(false);
  });

  it("clamps limit to max 50", async () => {
    const user = userEvent.setup();
    render(<KeywordSearchPage />);
    const limit = screen.getByLabelText(/Limit/) as HTMLInputElement;
    await user.clear(limit);
    await user.type(limit, "999");
    expect(Number(limit.value)).toBeLessThanOrEqual(50);
  });

  it("shows error when priceMin > priceMax", async () => {
    const user = userEvent.setup();
    render(<KeywordSearchPage />);
    await user.type(screen.getByLabelText(/Keyword/), "test");
    await user.type(screen.getByLabelText(/Price Min/), "500000");
    await user.type(screen.getByLabelText(/Price Max/), "100000");
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(screen.getByText(/Price min must be less than or equal to price max/i)).toBeInTheDocument();
  });
});
