import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ScoreBreakdownItem } from "@shopee-research/core";
import { ScoreBreakdown } from "./ScoreBreakdown.js";

describe("ScoreBreakdown", () => {
  it("renders breakdown header", () => {
    render(<ScoreBreakdown items={[]} />);
    expect(screen.getByRole("heading", { name: "Score Breakdown" })).toBeInTheDocument();
  });

  it("renders all items", () => {
    const items: ScoreBreakdownItem[] = [
      {
        component: "rating",
        score: 0.9,
        weight: 0.25,
        contribution: 0.225,
        reason: "Excellent rating",
        level: "high",
      },
      {
        component: "price",
        score: 0.3,
        weight: 0.15,
        contribution: 0.045,
        reason: "Premium price",
        level: "low",
      },
    ];
    render(<ScoreBreakdown items={items} />);
    expect(screen.getByText("rating")).toBeInTheDocument();
    expect(screen.getByText("price")).toBeInTheDocument();
    expect(screen.getByText("Excellent rating")).toBeInTheDocument();
    expect(screen.getByText("Premium price")).toBeInTheDocument();
  });

  it("shows formatted scores", () => {
    const items: ScoreBreakdownItem[] = [
      {
        component: "rating",
        score: 0.876,
        weight: 0.25,
        contribution: 0.219,
        reason: "Excellent rating",
        level: "high",
      },
    ];
    render(<ScoreBreakdown items={items} />);
    expect(screen.getByText("0.88")).toBeInTheDocument();
  });

  it("applies level class for color coding", () => {
    const items: ScoreBreakdownItem[] = [
      {
        component: "rating",
        score: 0.9,
        weight: 0.25,
        contribution: 0.225,
        reason: "Excellent rating",
        level: "high",
      },
    ];
    const { container } = render(<ScoreBreakdown items={items} />);
    expect(container.querySelector(".breakdownLevelHigh")).not.toBeNull();
  });
});
