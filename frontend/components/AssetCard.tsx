import type { Move } from '@/lib/types';
import { moveColor, pct, price } from './format';

export function AssetCard({ move }: { move: Move }) {
  const catalyst = move.catalysts[0];
  const why = catalyst?.headline ?? catalyst?.title;
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">{move.displayName}</span>
        {move.significant && (
          <span className="pill bg-mixed/15 text-mixed" title={`z-score ${move.zscore}`}>
            sig · z{move.zscore}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg tabular-nums">{price(move.price)}</span>
        <span className={`tabular-nums ${moveColor(move.direction)}`}>{pct(move.changePct)}</span>
      </div>
      <div className="text-xs text-muted">
        {why ? (
          <>
            {why} <span className="opacity-60">· {catalyst?.source}</span>
          </>
        ) : move.significant ? (
          'No catalyst in window — positioning/flow'
        ) : (
          'Within noise'
        )}
      </div>
    </div>
  );
}
