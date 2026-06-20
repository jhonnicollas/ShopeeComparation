import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage.js";

describe("HomePage", () => {
  it("renders the app title", () => {
    render(<HomePage />);
    expect(screen.getByText("Shopee Product Research AI")).toBeInTheDocument();
  });

  it("renders the compare links heading", () => {
    const { container } = render(<HomePage />);
    const heading = container.querySelector("h2");
    expect(heading).toHaveTextContent("Compare Links");
  });
});
