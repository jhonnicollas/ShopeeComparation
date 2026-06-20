import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { apiRequest } from "../lib/api.js";

interface SessionDetail {
  researchSessionId: string;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  status: string;
  bestProductId: string | null;
  totalProducts: number;
  completedProducts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComparisonItem {
  id: string;
  rank: number;
  productId: string;
  shopId: string;
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
  riskJson: unknown[] | null;
}

interface ComparisonResponse {
  comparison: {
    id: string;
    researchSessionId: string;
    title: string;
    mode: string;
    bestProductId: string;
  } | null;
  items: ComparisonItem[];
}

interface AiReportResponse {
  report: {
    bestProductIndex: number;
    confidence: string;
    ranking: Array<{ index: number; reason: string }>;
    pros: string[];
    cons: string[];
    redFlags: string[];
    missingDataNotes: string[];
  } | null;
  rawText: string | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls = `statusBadge statusBadge${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return <span className={cls}>{status}</span>;
}

export function ResearchDetailPage({ researchSessionId }: { researchSessionId: string }) {
  const sessionQuery = useQuery({
    queryKey: ["research", "session", researchSessionId],
    queryFn: () => apiRequest<SessionDetail>(`/research/sessions/${researchSessionId}`),
  });

  const comparisonQuery = useQuery({
    queryKey: ["research", "comparison", researchSessionId],
    queryFn: () => apiRequest<ComparisonResponse>(`/research/comparisons/by-session/${researchSessionId}`),
    enabled: sessionQuery.data?.status === "completed" || sessionQuery.data?.status === "partialSuccess",
  });

  const aiReportQuery = useQuery({
    queryKey: ["research", "ai-report", comparisonQuery.data?.comparison?.id],
    queryFn: async () => {
      const comparisonId = comparisonQuery.data?.comparison?.id;
      if (!comparisonId) return null;
      return apiRequest<AiReportResponse>(`/research/comparisons/${comparisonId}/ai-report`);
    },
    enabled: !!comparisonQuery.data?.comparison?.id,
  });

  if (sessionQuery.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading research details...</div>
      </section>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load research details</div>
      </section>
    );
  }

  const session = sessionQuery.data;
  const comparison = comparisonQuery.data;
  const aiReport = aiReportQuery.data;

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Research Detail</p>
        <h1>{session.mode === "keywordSearch" ? `Keyword: ${session.keyword}` : "Compare Links"}</h1>
        <div className="detailMeta">
          <StatusBadge status={session.status} />
          <span>{formatDate(session.createdAt)}</span>
          {session.shippedFrom && <span>Shipped from: {session.shippedFrom}</span>}
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Total Products</span>
          <span className="statValue">{session.totalProducts}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Completed</span>
          <span className="statValue">{session.completedProducts}</span>
        </div>
      </div>

      {session.errorMessage && (
        <div className="formError">
          <strong>Error:</strong> {session.errorMessage}
        </div>
      )}

      {comparison && comparison.items.length > 0 && (
        <div className="formPanel">
          <h2>Comparison Results</h2>
          <table className="dataTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Score</th>
                <th>Rating</th>
                <th>Price</th>
                <th>Shop</th>
              </tr>
            </thead>
            <tbody>
              {comparison.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.rank}</td>
                  <td>{item.productId}</td>
                  <td>{item.finalScore.toFixed(2)}</td>
                  <td>{item.ratingScore.toFixed(2)}</td>
                  <td>{item.priceScore.toFixed(2)}</td>
                  <td>{item.shopTrustScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aiReport?.report && (
        <div className="formPanel">
          <h2>AI Report</h2>
          <p>Confidence: {aiReport.report.confidence}</p>
          {aiReport.report.pros.length > 0 && (
            <div>
              <h3>Pros</h3>
              <ul>{aiReport.report.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
          {aiReport.report.cons.length > 0 && (
            <div>
              <h3>Cons</h3>
              <ul>{aiReport.report.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          {aiReport.report.redFlags.length > 0 && (
            <div>
              <h3>Red Flags</h3>
              <ul>{aiReport.report.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          {aiReport.report.missingDataNotes.length > 0 && (
            <div>
              <h3>Missing Data</h3>
              <ul>{aiReport.report.missingDataNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div>
        <Link to="/history" className="secondaryButton">Back to History</Link>
      </div>
    </section>
  );
}
