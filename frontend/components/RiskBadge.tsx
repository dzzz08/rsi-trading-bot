import type { RiskBreakdown, RiskLabel } from '@/lib/types';
import { riskColor, riskLabelText } from './format';

export function RiskBadge({ label, breakdown }: { label: RiskLabel; breakdown: RiskBreakdown }) {
  const components: [string, number][] = [
    ['Equities', breakdown.equities],
    ['Crypto', breakdown.crypto],
    ['DXY', breakdown.dxy],
    ['JPY', breakdown.jpy],
    ['Gold', breakdown.gold],
    ['Yields', breakdown.yields],
  ];
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">Risk Sentiment</span>
        <span className={`pill ${riskColor(label)}`}>{riskLabelText(label)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {components.map(([name, vote]) => (
          <span
            key={name}
            className={`pill ${vote > 0 ? 'bg-riskon/10 text-riskon' : vote < 0 ? 'bg-riskoff/10 text-riskoff' : 'bg-edge text-muted'}`}
            title="+1 risk-on / -1 risk-off"
          >
            {name} {vote > 0 ? '+1' : vote}
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-muted">
        Net score {breakdown.score} · rule-based (votes: +1 risk-on / −1 risk-off)
      </div>
    </div>
  );
}
