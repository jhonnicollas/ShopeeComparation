import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";

interface ComparisonItem {
  id: string;
  rank: number;
  productId: string;
  shopId: string | null;
  finalScore: number;
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenalty: number;
  prosJson: string[] | null;
  consJson: string[] | null;
  riskJson: string[] | null;
}

interface ResearchSession {
  researchSessionId: string;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  status: string;
  bestProductId: string | null;
  totalProducts: number;
  completedProducts: number;
  errorMessage: string | null;
}

interface Comparison {
  id: string;
  researchSessionId: string;
  title: string | null;
  mode: string;
  bestProductId: string | null;
}

interface AiReportResponse {
  report: {
    bestProductId: string | null;
    bestProductName: string | null;
    ranking: Array<{ productId: string; rank: number; reason: string }>;
    valueForMoneyProductId: string | null;
    safestProductId: string | null;
    riskiestProductId: string | null;
    prosCons: Array<{ productId: string; pros: string[]; cons: string[] }>;
    redFlags: Array<{ productId: string; type: string; message: string }>;
    confidence: number;
    missingDataNotes: string[];
  } | null;
  rawText: string | null;
}

export function ResultPage() {
  const params = useParams({ strict: false }) as { researchSessionId?: string };
  const navigate = useNavigate();
  const sessionId = params.researchSessionId ?? "";
  const [error, setError] = useState<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/research/sessions/${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as ResearchSession;
    },
    enabled: !!sessionId,
  });

  const comparisonQuery = useQuery({
    queryKey: ["comparison", sessionId],
    queryFn: async (): Promise<{ comparison: Comparison | null; items: ComparisonItem[] }> => {
      const res = await fetch(`/api/research/comparisons/by-session/${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) return { comparison: null, items: [] };
      return (await res.json()) as { comparison: Comparison | null; items: ComparisonItem[] };
    },
    enabled: !!sessionId,
  });

  const aiReportQuery = useQuery({
    queryKey: ["ai-report", comparisonQuery.data?.comparison?.id],
    queryFn: async (): Promise<AiReportResponse | null> => {
      const id = comparisonQuery.data?.comparison?.id;
      if (!id) return null;
      const res = await fetch(`/api/research/comparisons/${id}/ai-report`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as AiReportResponse;
    },
    enabled: !!comparisonQuery.data?.comparison?.id,
  });

  useEffect(() => {
    if (sessionQuery.data?.status === "failed") {
      setError(sessionQuery.data.errorMessage ?? "Research session failed");
    }
  }, [sessionQuery.data]);

  if (!sessionId) {
    return (
      <section className="pageStack">
        <div className="formError">Missing research session ID</div>
      </section>
    );
  }

  if (sessionQuery.isLoading || comparisonQuery.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading results...</div>
      </section>
    );
  }

  if (!sessionQuery.data) {
    return (
      <section className="pageStack">
        <div className="formError">Session not found</div>
      </section>
    );
  }

  const session = sessionQuery.data;
  const items = comparisonQuery.data?.items ?? [];
  const bestItem = items.find((i) => i.rank === 1);
  const isKeywordSearch = session.mode === "keywordSearch";

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">{isKeywordSearch ? "Keyword Search Results" : "Compare Results"}</p>
        <h1>{isKeywordSearch ? `Top ${items.length} for "${session.keyword ?? ""}"` : "Comparison Results"}</h1>
        <p className="lede">
          {isKeywordSearch && (
            <>
              Shipped from: <strong>{session.shippedFrom ?? "N/A"}</strong> ·{" "}
              Best product: <strong>{bestItem?.productId ?? "N/A"}</strong> (Rank 1 of {items.length})
            </>
          )}
          {!isKeywordSearch && (
            <>
              Best product: <strong>{bestItem?.productId ?? "N/A"}</strong> (Rank 1 of {items.length})
            </>
          )}
        </p>
        {error && (
          <div className="formError" role="alert">
            {error}
          </div>
        )}
        {session.status === "partialSuccess" && (
          <div className="partialSuccessBanner">
            Some items failed to enrich. Showing partial results.
          </div>
        )}
      </div>
      {bestItem && (
        <div className="formPanel">
          <h2>Best Product</h2>
          <div className="bestProductCallout">
            <span className="rankBadge">#{bestItem.rank}</span>
            <span className="bestProductId">{bestItem.productId}</span>
            <span className="bestScore">Score: {bestItem.finalScore.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div className="resultGrid">
        {items.length === 0 ? (
          <div className="placeholderPanel">No comparison items yet.</div>
        ) : (
          items.map((item) => {
            const aiRank = aiReportQuery.data?.report?.ranking.find((r) => r.productId === item.productId);
            return (
              <article key={item.id} className="resultCard">
                <div className="resultCardHeader">
                  <span className="rankBadge">#{item.rank}</span>
                  <h2>{item.productId}</h2>
                  {aiRank && (
                    <span className="aiRankBadge">AI: {aiRank.reason}</span>
                  )}
                </div>
                <div className="scoreGrid">
                  <div className="scoreItem">
                    <span className="scoreLabel">Final</span>
                    <span className="scoreValue">{item.finalScore.toFixed(2)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Rating</span>
                    <span className="scoreValue">{item.ratingScore.toFixed(2)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Reviews</span>
                    <span className="scoreValue">{item.reviewCountScore.toFixed(2)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Sold</span>
                    <span className="scoreValue">{item.soldCountScore.toFixed(2)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Price</span>
                    <span className="scoreValue">{item.priceScore.toFixed(2)}</span>
                  </div>
                  <div className="scoreItem">
                    <span className="scoreLabel">Shop</span>
                    <span className="scoreValue">{item.shopTrustScore.toFixed(2)}</span>
                  </div>
                </div>
                {item.prosJson && item.prosJson.length > 0 && (
                  <div className="prosConsSection">
                    <h3>Pros</h3>
                    <ul>
                      {item.prosJson.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.consJson && item.consJson.length > 0 && (
                  <div className="prosConsSection">
                    <h3>Cons</h3>
                    <ul>
                      {item.consJson.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.riskJson && item.riskJson.length > 0 && (
                  <div className="riskSection">
                    <h3>Risks</h3>
                    <ul>
                      {item.riskJson.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
      {aiReportQuery.data?.report && (
        <div className="formPanel">
          <h2>AI Recommendation</h2>
          <p>
            Confidence: <strong>{(aiReportQuery.data.report.confidence * 100).toFixed(0)}%</strong>
          </p>
          {aiReportQuery.data.report.bestProductId && (
            <p>AI Best: <strong>{aiReportQuery.data.report.bestProductId}</strong></p>
          )}
          {aiReportQuery.data.report.valueForMoneyProductId && (
            <p>Best Value: <strong>{aiReportQuery.data.report.valueForMoneyProductId}</strong></p>
          )}
          {aiReportQuery.data.report.safestProductId && (
            <p>Safest: <strong>{aiReportQuery.data.report.safestProductId}</strong></p>
          )}
          {aiReportQuery.data.report.riskiestProductId && (
            <p>Riskiest: <strong>{aiReportQuery.data.report.riskiestProductId}</strong></p>
          )}
          {aiReportQuery.data.report.missingDataNotes.length > 0 && (
            <div className="missingDataNotes">
              <h3>Missing Data Notes</h3>
              <ul>
                {aiReportQuery.data.report.missingDataNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="secondaryButton"
            onClick={() => navigate({ to: isKeywordSearch ? "/keyword-search" : "/compare" })}
          >
            Run another {isKeywordSearch ? "search" : "comparison"}
          </button>
        </div>
      )}
    </section>
  );
}
