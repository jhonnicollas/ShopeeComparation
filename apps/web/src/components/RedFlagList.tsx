import type { RiskItem } from "@shopee-research/shared";

export function RedFlagList({ risks }: { risks: RiskItem[] }) {
  if (risks.length === 0) {
    return <div className="redFlagEmpty">No red flags detected</div>;
  }
  const sorted = [...risks].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.severity] - order[b.severity];
  });
  const grouped: Record<"HIGH" | "MEDIUM" | "LOW", RiskItem[]> = {
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };
  for (const risk of sorted) {
    grouped[risk.severity].push(risk);
  }
  return (
    <div className="redFlagList">
      <h3>Red Flags</h3>
      {grouped.HIGH.length > 0 && (
        <div className="redFlagGroup">
          <h4 className="redFlagSeverityHigh">High ({grouped.HIGH.length})</h4>
          <ul>
            {grouped.HIGH.map((risk, i) => (
              <li key={`${risk.type}-${i}`} className="redFlagItem redFlagItemHigh">
                <span className="redFlagType">{risk.type.replace(/_/g, " ")}</span>
                <span className="redFlagMessage">{risk.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {grouped.MEDIUM.length > 0 && (
        <div className="redFlagGroup">
          <h4 className="redFlagSeverityMedium">Medium ({grouped.MEDIUM.length})</h4>
          <ul>
            {grouped.MEDIUM.map((risk, i) => (
              <li key={`${risk.type}-${i}`} className="redFlagItem redFlagItemMedium">
                <span className="redFlagType">{risk.type.replace(/_/g, " ")}</span>
                <span className="redFlagMessage">{risk.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {grouped.LOW.length > 0 && (
        <div className="redFlagGroup">
          <h4 className="redFlagSeverityLow">Low ({grouped.LOW.length})</h4>
          <ul>
            {grouped.LOW.map((risk, i) => (
              <li key={`${risk.type}-${i}`} className="redFlagItem redFlagItemLow">
                <span className="redFlagType">{risk.type.replace(/_/g, " ")}</span>
                <span className="redFlagMessage">{risk.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
