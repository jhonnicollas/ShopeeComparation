import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiClientError } from "../lib/api.js";
import { ResolverDiagnostics } from "../components/ResolverDiagnostics.js";

interface CompareLinksResponse {
  researchSessionId: string;
  jobId: string;
  status: string;
}

interface JobStatus {
  jobId: string;
  researchSessionId: string | null;
  type: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  currentStep: string | null;
  errorMessage: string | null;
}

const MAX_LINKS = 5;

export function ComparePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (input: { links: string[] }) => {
      const res = await fetch("/api/research/compare-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: { code: string; message: string } };
        throw new ApiClientError(res.status, body.error.code, body.error.message, null);
      }
      return (await res.json()) as CompareLinksResponse;
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    },
  });

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/research/jobs/${jobId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as JobStatus;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.status === "completed" || data.status === "failed") return false;
      return 3000;
    },
  });

  const handleSubmit = () => {
    const validLinks = links.filter((l) => l.trim().length > 0);
    if (validLinks.length === 0) {
      setError("Please add at least one link");
      return;
    }
    submitMutation.mutate({ links: validLinks });
  };

  const updateLink = (idx: number, value: string) => {
    setLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  };

  const addLink = () => {
    if (links.length < MAX_LINKS) {
      setLinks((prev) => [...prev, ""]);
    }
  };

  const removeLink = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Research</p>
        <h1>Compare Links</h1>
        <p className="lede">
          Submit up to {MAX_LINKS} Shopee product links for async comparison.
        </p>
      </div>
      <div className="formPanel">
        {links.map((link, idx) => (
          <div key={idx} className="formField">
            <label htmlFor={`link-${idx}`}>Link {idx + 1}</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id={`link-${idx}`}
                type="url"
                value={link}
                onChange={(e) => updateLink(idx, e.target.value)}
                placeholder="https://shopee.co.id/product/..."
                disabled={submitMutation.isPending}
                style={{ flex: 1 }}
              />
              {links.length > 1 && (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => removeLink(idx)}
                  disabled={submitMutation.isPending}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {links.length < MAX_LINKS && (
          <button
            type="button"
            className="secondaryButton"
            onClick={addLink}
            disabled={submitMutation.isPending}
          >
            + Add Link
          </button>
        )}
        {error ? (
          <div className="formError" role="alert">
            {error}
          </div>
        ) : null}
        <button
          type="button"
          className="primaryButton"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Compare"}
        </button>
      </div>
      {jobQuery.data && (
        <div className="formPanel">
          <h2>Job Status</h2>
          <p>
            Status: <strong>{jobQuery.data.status}</strong>
          </p>
          {jobQuery.data.progressTotal > 0 && (
            <p>
              Progress: {jobQuery.data.jobId ? jobQuery.data.progressCurrent : 0} / {jobQuery.data.progressTotal}
            </p>
          )}
          {jobQuery.data.currentStep && <p>Step: {jobQuery.data.currentStep}</p>}
          {jobQuery.data.status === "completed" && jobQuery.data.researchSessionId && (
            <button
              type="button"
              className="primaryButton"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["job", jobId] });
                navigate({ to: "/compare" });
              }}
            >
              View Results
            </button>
          )}
        </div>
      )}
      <div className="formPanel">
        <h2>URL Resolver Diagnostics</h2>
        <p className="lede">
          Test a Shopee URL to see which resolver adapter succeeds. Short URLs like
          <code>id.shp.ee/...</code> are tried against direct parsing, HTTP redirect, 9router web fetch,
          and Browser Run in that order.
        </p>
        <input
          id="resolver-test-url"
          type="url"
          value={links[0] ?? ""}
          onChange={(e) => updateLink(0, e.target.value)}
          placeholder="https://shopee.co.id/product/... or https://id.shp.ee/..."
          style={{ width: "100%", marginBottom: "12px" }}
        />
        <ResolverDiagnostics url={links[0] ?? ""} />
      </div>
    </section>
  );
}
