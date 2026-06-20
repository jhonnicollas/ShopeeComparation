import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobLogsPage } from "./JobLogsPage.js";

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
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockQueryData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: null,
  }),
}));

describe("JobLogsPage", () => {
  it("renders loading state", () => {
    mockIsLoading = true;
    mockIsError = false;
    mockQueryData = undefined;
    render(<JobLogsPage jobId="job_1" />);
    expect(screen.getByText("Loading job logs...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockIsLoading = false;
    mockIsError = true;
    mockQueryData = undefined;
    render(<JobLogsPage jobId="job_1" />);
    expect(screen.getByText("Failed to load job logs")).toBeInTheDocument();
  });

  it("renders job details", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = {
      jobId: "job_1",
      researchSessionId: "rsr_1",
      type: "compareLinks",
      status: "completed",
      progressCurrent: 5,
      progressTotal: 5,
      currentStep: null,
      errorMessage: null,
      createdAt: "2026-06-20T10:00:00Z",
      updatedAt: "2026-06-20T10:05:00Z",
    };
    render(<JobLogsPage jobId="job_1" />);
    expect(screen.getByText("Job compareLinks")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows error message when job failed", () => {
    mockIsLoading = false;
    mockIsError = false;
    mockQueryData = {
      jobId: "job_2",
      researchSessionId: "rsr_2",
      type: "keywordSearch",
      status: "failed",
      progressCurrent: 2,
      progressTotal: 5,
      currentStep: "extract_product",
      errorMessage: "Network timeout",
      createdAt: "2026-06-20T10:00:00Z",
      updatedAt: "2026-06-20T10:03:00Z",
    };
    render(<JobLogsPage jobId="job_2" />);
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(screen.getByText("extract_product")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });
});
