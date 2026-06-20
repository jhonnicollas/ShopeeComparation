import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";

interface AiReportStructured {
  bestProductId: string | null;
  bestProductName: string | null;
  ranking: Array<{ productId: string; rank: number; reason: string }>;
  valueForMoneyProductId: string | null;
  safestProductId: string | null;
  riskiestProductId: string | null;
  prosCons: Array<{ productId: string; pros: string[]; cons: string[] }>;
  redFlags: string[];
  confidence: number;
  missingDataNotes: string[];
}

export function AiReportView({ comparisonId }: { comparisonId: string }) {
  const [expanded, setExpanded] = useState(false);
  const query = useQuery({
    queryKey: ["ai-report", comparisonId],
    queryFn: async () => {
      try {
        return await apiRequest<{ report: AiReportStructured | null; rawText: string | null }>(
          `/comparisons/${comparisonId}/ai-report`
        );
      } catch {
        return null;
      }
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

  const findProductName = (id: string | null) => {
    if (!id) return "N/A";
    const ranked = report.ranking.find((r) => r.productId === id);
    if (ranked) return id;
    const pc = report.prosCons.find((p) => p.productId === id);
    if (pc) return id;
    return id;
  };

  const bestName = report.bestProductName ?? findProductName(report.bestProductId);
  const valueForMoneyName = findProductName(report.valueForMoneyProductId);
  const safestName = findProductName(report.safestProductId);
  const riskiestName = findProductName(report.riskiestProductId);

  return (
    <div className="aiReport">
      <div className="aiReportHeader">
        <div>
          <h3>AI Recommendation Report</h3>
          <p className="aiReportSubtitle">
            Laporan naratif berdasarkan data produk dan toko terstruktur
          </p>
        </div>
        <div className="aiReportConfidence">
          <span className="aiLabel">Confidence</span>
          <span className="aiConfidenceValue">{(report.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="aiReportSection aiReportBestProduct">
        <h4>1. Produk Terbaik</h4>
        <div className="aiReportBestProductName">{bestName}</div>
      </div>

      {report.ranking.length > 0 && (
        <div className="aiReportSection">
          <h4>3. Ranking Produk</h4>
          <ol className="aiRankingList">
            {report.ranking.map((item) => (
              <li key={item.productId}>
                <div className="aiRankNumber">#{item.rank}</div>
                <div className="aiRankBody">
                  <div className="aiRankProductId">{item.productId}</div>
                  {item.reason && <div className="aiRankReason">{item.reason}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {report.valueForMoneyProductId && (
        <div className="aiReportSection">
          <h4>4. Produk Value-for-Money</h4>
          <div className="aiHighlightProduct">{valueForMoneyName}</div>
          <p className="aiNote">Produk dengan rasio skor per harga terbaik</p>
        </div>
      )}

      {report.safestProductId && (
        <div className="aiReportSection">
          <h4>5. Produk Paling Aman</h4>
          <div className="aiHighlightProduct aiSafe">{safestName}</div>
          <p className="aiNote">Produk dengan risiko paling rendah</p>
        </div>
      )}

      {report.riskiestProductId && (
        <div className="aiReportSection">
          <h4>6. Produk Paling Berisiko</h4>
          <div className="aiHighlightProduct aiRisky">{riskiestName}</div>
          <p className="aiNote">Produk dengan risiko paling tinggi — perlu perhatian</p>
        </div>
      )}

      {report.prosCons.length > 0 && (
        <div className="aiReportSection">
          <h4>7. Kelebihan dan Kekurangan Setiap Produk</h4>
          {report.prosCons.map((pc) => (
            <div key={pc.productId} className="aiProsConsCard">
              <div className="aiProsConsHeader">{pc.productId}</div>
              {pc.pros.length > 0 && (
                <div className="aiPros">
                  <strong>Kelebihan:</strong>
                  <ul>
                    {pc.pros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pc.cons.length > 0 && (
                <div className="aiCons">
                  <strong>Kekurangan:</strong>
                  <ul>
                    {pc.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {report.redFlags.length > 0 && (
        <div className="aiReportSection">
          <h4>8. Red Flag</h4>
          <ul className="aiRedFlagList">
            {report.redFlags.map((flag, i) => (
              <li key={i} className="aiRedFlagItem">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {report.missingDataNotes.length > 0 && (
        <div className="aiReportSection">
          <h4>10. Catatan Data Tidak Tersedia</h4>
          <ul className="aiMissingList">
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