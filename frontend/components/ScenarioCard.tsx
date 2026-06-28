import type { Scenario } from '@/lib/types';

const STYLE: Record<Scenario['kind'], { label: string; ring: string; text: string }> = {
  bull: { label: 'Bull', ring: 'border-riskon/40', text: 'text-riskon' },
  bear: { label: 'Bear', ring: 'border-riskoff/40', text: 'text-riskoff' },
  chop: { label: 'Chop', ring: 'border-mixed/40', text: 'text-mixed' },
};

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const s = STYLE[scenario.kind];
  return (
    <div className={`card border ${s.ring} flex flex-col gap-2`}>
      <span className={`text-sm font-semibold uppercase tracking-wider ${s.text}`}>{s.label} case</span>
      <p className="text-sm text-slate-200">{scenario.thesis}</p>
      {scenario.conditions.length > 0 && (
        <div>
          <span className="text-xs uppercase text-muted">If</span>
          <ul className="mt-1 list-disc pl-4 text-xs text-slate-300">
            {scenario.conditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {scenario.invalidation.length > 0 && (
        <div>
          <span className="text-xs uppercase text-muted">Invalidation</span>
          <ul className="mt-1 list-disc pl-4 text-xs text-slate-400">
            {scenario.invalidation.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
