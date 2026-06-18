import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AiReportStructured {
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
}

export function AiReportView({ comparisonId }: { comparisonId: string }) {
  const [expanded, setExpanded] = useState(false);
  const query = useQuery({
    queryKey: ["ai-report", comparisonId],
    queryFn: async () => {
      const res = await fetch(`/api/comparisons/${comparisonId}/ai-report`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as { report: AiReportStructured | null; rawText: string | null };
    },
    enabled: !!comparisonId,
  });

  if (query.isLoading) {
    return <div className="loadingState">Loading AI report...</div>;
  }

  if (!query.data?.report) {
    return (
      <div className="aiReportEmpty">
        AI report not yet available. Check back after processing completes.
      </div>
    );
  }

  const report = query.data.report;
  return (
    <div className="aiReport">
      <h3>AI Recommendation Report</h3>
      <div className="aiReportHeader">
        <div className="aiReportBest">
          <span className="aiLabel">Best Product</span>
          <span className="aiBestValue">{report.bestProductName ?? report.bestProductId ?? "N/A"}</span>
        </div>
        <div className="aiReportConfidence">
          <span className="aiLabel">Confidence</span>
          <span className="aiConfidenceValue">{(report.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="aiReportSection">
        <h4>Ranking</h4>
        <ol>
          {report.ranking.slice(0, 5).map((item) => (
            <li key={item.productId}>
              <strong>{item.productId}</strong>
              {item.reason && <span> — {item.reason}</span>}
            </li>
          ))}
        </ol>
      </div>
      {report.prosCons.length > 0 && (
        <div className="aiReportSection">
          <h4>Pros & Cons</h4>
          {report.prosCons.slice(0, 5).map((pc) => (
            <div key={pc.productId} className="aiProsConsItem">
              <strong>{pc.productId}</strong>
              <div className="aiProsConsBody">
                {pc.pros.length > 0 && (
                  <div className="aiPros">
                    <strong>Pros:</strong> {pc.pros.join(", ")}
                  </div>
                )}
                {pc.cons.length > 0 && (
                  <div className="aiCons">
                    <strong>Cons:</strong> {pc.cons.join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {report.redFlags.length > 0 && (
        <div className="aiReportSection">
          <h4>Red Flags</h4>
          <ul>
            {report.redFlags.map((flag, i) => (
              <li key={i}>
                <strong>{flag.productId}:</strong> {flag.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {report.missingDataNotes.length > 0 && (
        <div className="aiReportSection">
          <h4>Missing Data Notes</h4>
          <ul>
            {report.missingDataNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      {query.data.rawText && (
        <button
          type="button"
          className="secondaryButton"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Show"} Raw Response
        </button>
      )}
      {expanded && query.data.rawText && (
        <pre className="aiReportRaw">{query.data.rawText}</pre>
      )}
    </div>
  );
}
