'use client';

import { useState } from 'react';
import type { AssetClass, Briefing, WatchlistItem } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { AssetCard } from './AssetCard';
import { ScenarioCard } from './ScenarioCard';
import { SectionView } from './SectionView';
import { CalendarList } from './CalendarList';
import { NotesPanel } from './NotesPanel';

type Tab = 'briefing' | 'assets' | 'calendar' | 'watchlist' | 'notes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'assets', label: 'Assets' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'notes', label: 'Notes' },
];

const CLASS_LABEL: Record<AssetClass, string> = {
  fx: 'FX',
  commodity: 'Commodities',
  index: 'Indices',
  crypto: 'Crypto',
};

export function Dashboard({
  briefing,
  watchlist,
  sample,
}: {
  briefing: Briefing;
  watchlist: WatchlistItem[];
  sample: boolean;
}) {
  const [tab, setTab] = useState<Tab>('briefing');
  const ordered = [...briefing.sections].sort((a, b) => a.sectionNo - b.sectionNo);
  const whatMatters = ordered.find((s) => s.key === 'what_matters');

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Header briefing={briefing} sample={sample} />

      {whatMatters && (
        <div className="mt-4 rounded-xl border border-edge bg-panel2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted">What actually matters today</div>
          <p className="section-body mt-1">{whatMatters.body}</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RiskBadge label={briefing.riskSentiment} breakdown={briefing.riskBreakdown} />
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-muted">Scenarios</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {briefing.scenarios.map((s) => (
              <div key={s.kind} className="rounded-lg border border-edge bg-panel2 p-2">
                <div className="font-semibold capitalize">{s.kind}</div>
                <div className="mt-1 text-muted line-clamp-3">{s.thesis}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs tab={tab} setTab={setTab} />

      <div className="mt-4">
        {tab === 'briefing' && (
          <div className="flex flex-col gap-3">
            {ordered.map((s) => (
              <SectionView key={s.key} section={s} />
            ))}
            {briefing.scenarios.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {briefing.scenarios.map((s) => (
                  <ScenarioCard key={s.kind} scenario={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'assets' && <AssetsTab briefing={briefing} />}
        {tab === 'calendar' && <CalendarList events={briefing.calendarToday} />}
        {tab === 'watchlist' && <WatchlistTab briefing={briefing} watchlist={watchlist} />}
        {tab === 'notes' && <NotesPanel briefingId={briefing.id} />}
      </div>

      <Footer />
    </main>
  );
}

function Header({ briefing, sample }: { briefing: Briefing; sample: boolean }) {
  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">ZardoshtiOS · Market Intelligence</h1>
        {sample && (
          <span className="pill bg-mixed/15 text-mixed" title="Backend not reached — bundled sample">
            sample data
          </span>
        )}
      </div>
      <div className="text-sm text-muted">
        Morning Briefing · {briefing.briefingDate} · {briefing.window.label} · model:{briefing.model}
      </div>
    </header>
  );
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-edge">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`whitespace-nowrap px-3 py-2 text-sm ${
            tab === t.id ? 'border-b-2 border-slate-200 text-slate-100' : 'text-muted hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function AssetsTab({ briefing }: { briefing: Briefing }) {
  const classes: AssetClass[] = ['fx', 'commodity', 'index', 'crypto'];
  return (
    <div className="flex flex-col gap-5">
      {classes.map((cls) => {
        const moves = briefing.moves.filter((m) => m.assetClass === cls);
        if (moves.length === 0) return null;
        return (
          <section key={cls}>
            <h2 className="mb-2 text-xs uppercase tracking-wider text-muted">{CLASS_LABEL[cls]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moves.map((m) => (
                <AssetCard key={m.symbol} move={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WatchlistTab({ briefing, watchlist }: { briefing: Briefing; watchlist: WatchlistItem[] }) {
  const moves = watchlist
    .map((w) => briefing.moves.find((m) => m.symbol === w.symbol))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  if (moves.length === 0) return <div className="card text-sm text-muted">Watchlist is empty.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {moves.map((m) => (
        <AssetCard key={m.symbol} move={m} />
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-edge pt-4 text-xs text-muted">
      Research/analyst context only — not financial advice, no buy/sell instructions. Causal
      claims are grounded in ingested data and cited.
    </footer>
  );
}
