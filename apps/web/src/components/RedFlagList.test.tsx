import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RiskItem } from "@shopee-research/shared";
import { RedFlagList } from "./RedFlagList.js";

describe("RedFlagList", () => {
  it("shows empty state when no risks", () => {
    render(<RedFlagList risks={[]} />);
    expect(screen.getByText(/No red flags detected/)).toBeInTheDocument();
  });

  it("renders risk items with severity groups", () => {
    const risks: RiskItem[] = [
      { type: "low_rating", severity: "HIGH", message: "Rating too low", impact: 0.3 },
      { type: "few_reviews", severity: "MEDIUM", message: "Few reviews", impact: 0.2 },
    ];
    render(<RedFlagList risks={risks} />);
    expect(screen.getByText(/High \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medium \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Rating too low")).toBeInTheDocument();
    expect(screen.getByText("Few reviews")).toBeInTheDocument();
  });

  it("sorts HIGH before MEDIUM before LOW", () => {
    const risks: RiskItem[] = [
      { type: "high_price", severity: "LOW", message: "Expensive", impact: 0.1 },
      { type: "low_rating", severity: "HIGH", message: "Low rating", impact: 0.3 },
      { type: "low_stock", severity: "MEDIUM", message: "Low stock", impact: 0.1 },
    ];
    render(<RedFlagList risks={risks} />);
    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings[0]?.textContent).toMatch(/High/);
    expect(headings[1]?.textContent).toMatch(/Medium/);
    expect(headings[2]?.textContent).toMatch(/Low/);
  });

  it("renders risk type in human-readable format", () => {
    const risks: RiskItem[] = [
      { type: "low_rating", severity: "HIGH", message: "Rating", impact: 0.3 },
    ];
    render(<RedFlagList risks={risks} />);
    expect(screen.getByText("low rating")).toBeInTheDocument();
  });
});
