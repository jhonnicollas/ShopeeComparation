import { useEffect } from "react";
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

export function ResultPage() {
  const params = useParams({ strict: false }) as { researchSessionId?: string };
  const navigate = useNavigate();
  const sessionId = params.researchSessionId ?? "";

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
      const res = await fetch(`/api/comparisons/by-session/${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) return { comparison: null, items: [] };
      return (await res.json()) as { comparison: Comparison | null; items: ComparisonItem[] };
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (sessionQuery.data?.status === "failed") {
      navigate({ to: "/" });
    }
  }, [sessionQuery.data, navigate]);

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

  const items = comparisonQuery.data?.items ?? [];
  const bestItem = items.find((i) => i.rank === 1);

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Results</p>
        <h1>Comparison Results</h1>
        <p className="lede">
          Best product: {bestItem?.productId ?? "N/A"} (Rank 1 of {items.length})
        </p>
      </div>
      <div className="resultGrid">
        {items.length === 0 ? (
          <div className="placeholderPanel">No comparison items yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="resultCard">
              <div className="resultCardHeader">
                <span className="rankBadge">#{item.rank}</span>
                <h2>{item.productId}</h2>
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
            </article>
          ))
        )}
      </div>
    </section>
  );
}
