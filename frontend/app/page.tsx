import { getLatestBriefing, getWatchlist } from '@/lib/api';
import { Dashboard } from '@/components/Dashboard';

// Server component: fetch on the server (falls back to the bundled sample when
// no backend is configured/reachable), then hand to the client dashboard.
export default async function Page() {
  const [briefing, watchlist] = await Promise.all([getLatestBriefing(), getWatchlist()]);
  return (
    <Dashboard
      briefing={briefing.data}
      watchlist={watchlist.data}
      sample={briefing.sample}
    />
  );
}
