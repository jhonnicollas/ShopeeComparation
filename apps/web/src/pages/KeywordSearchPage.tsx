import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiClientError } from "../lib/api.js";

interface KeywordSearchResponse {
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

interface KeywordSearchInput {
  keyword: string;
  shippedFrom: string;
  limit: number;
  priceMin: number | null;
  priceMax: number | null;
  minimumRating: number | null;
  storeStatus: string[];
}

const STORE_STATUS_OPTIONS = ["MALL", "OFFICIAL", "STAR", "STARPLUS", "PREFERRED", "REGULAR"];

export function KeywordSearchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [shippedFrom, setShippedFrom] = useState("DKI Jakarta");
  const [limit, setLimit] = useState(10);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minimumRating, setMinimumRating] = useState("");
  const [storeStatus, setStoreStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [researchSessionId, setResearchSessionId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (input: KeywordSearchInput) => {
      const res = await fetch("/api/research/keyword-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: { code: string; message: string } };
        throw new ApiClientError(res.status, body.error.code, body.error.message, null);
      }
      return (await res.json()) as KeywordSearchResponse;
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      setResearchSessionId(data.researchSessionId);
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
      if (data.status === "completed" || data.status === "partialSuccess" || data.status === "failed") return false;
      return 3000;
    },
  });

  const toggleStoreStatus = (value: string) => {
    setStoreStatus((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const parseOptionalNumber = (value: string): number | null => {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = () => {
    if (keyword.trim().length === 0) {
      setError("Keyword is required");
      return;
    }
    const minPrice = parseOptionalNumber(priceMin);
    const maxPrice = parseOptionalNumber(priceMax);
    const rating = parseOptionalNumber(minimumRating);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setError("Price min must be less than or equal to price max");
      return;
    }
    submitMutation.mutate({
      keyword: keyword.trim(),
      shippedFrom: shippedFrom.trim() || "DKI Jakarta",
      limit,
      priceMin: minPrice,
      priceMax: maxPrice,
      minimumRating: rating,
      storeStatus,
    });
  };

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Research</p>
        <h1>Keyword Search Top 10</h1>
        <p className="lede">
          Search Shopee products by keyword and filter by shipped-from location (default DKI Jakarta).
          Returns top {limit} products ranked by deterministic scoring.
        </p>
      </div>
      <div className="formPanel">
        <div className="formField">
          <label htmlFor="keyword">Keyword *</label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="tensimeter digital"
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="shippedFrom">Shipped From</label>
          <input
            id="shippedFrom"
            type="text"
            value={shippedFrom}
            onChange={(e) => setShippedFrom(e.target.value)}
            placeholder="DKI Jakarta"
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="limit">Limit (1-50)</label>
          <input
            id="limit"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="priceMin">Price Min (IDR)</label>
          <input
            id="priceMin"
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="optional"
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="priceMax">Price Max (IDR)</label>
          <input
            id="priceMax"
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="optional"
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="minimumRating">Minimum Rating (0-5)</label>
          <input
            id="minimumRating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={minimumRating}
            onChange={(e) => setMinimumRating(e.target.value)}
            placeholder="optional"
            disabled={submitMutation.isPending}
          />
        </div>
        <div className="formField">
          <label>Store Status (optional)</label>
          <div className="checkboxGroup">
            {STORE_STATUS_OPTIONS.map((opt) => (
              <label key={opt} className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={storeStatus.includes(opt)}
                  onChange={() => toggleStoreStatus(opt)}
                  disabled={submitMutation.isPending}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
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
          {submitMutation.isPending ? "Submitting..." : "Search"}
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
              Progress: {jobQuery.data.progressCurrent} / {jobQuery.data.progressTotal}
            </p>
          )}
          {jobQuery.data.currentStep && <p>Step: {jobQuery.data.currentStep}</p>}
          {jobQuery.data.errorMessage && (
            <p className="formError" role="alert">
              {jobQuery.data.errorMessage}
            </p>
          )}
          {(jobQuery.data.status === "completed" || jobQuery.data.status === "partialSuccess") &&
            researchSessionId && (
              <button
                type="button"
                className="primaryButton"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["job", jobId] });
                  navigate({ to: "/results/$researchSessionId", params: { researchSessionId } });
                }}
              >
                View Results
              </button>
            )}
        </div>
      )}
    </section>
  );
}
