import type { ScoreBreakdownItem } from "@shopee-research/core";

export function ScoreBreakdown({ items }: { items: ScoreBreakdownItem[] }) {
  return (
    <div className="scoreBreakdown">
      <h3>Score Breakdown</h3>
      <div className="breakdownGrid">
        {items.map((item) => (
          <div key={item.component} className={`breakdownItem breakdownLevel${item.level.charAt(0).toUpperCase() + item.level.slice(1)}`}>
            <div className="breakdownHeader">
              <span className="breakdownComponent">{item.component.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className="breakdownScore">{item.score.toFixed(2)}</span>
            </div>
            <div className="breakdownMeta">
              Weight: {(item.weight * 100).toFixed(0)}% · Contribution: {item.contribution.toFixed(3)}
            </div>
            <div className="breakdownReason">{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
