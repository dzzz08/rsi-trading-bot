import type { NewsItem } from '../../../domain/news/NewsItem.js';
import type { NewsProvider, Window } from '../../../domain/ports/index.js';

/**
 * Deterministic mock headlines consistent with the risk-off mock tape. Each is
 * tagged with the assets it is relevant to so context retrieval can attach it
 * to the matching move.
 */
export class MockNewsProvider implements NewsProvider {
  readonly name = 'mock-news';

  async getNews(window: Window): Promise<NewsItem[]> {
    const t = (offsetH: number) =>
      new Date(new Date(window.to).getTime() - offsetH * 3600_000).toISOString();

    return [
      {
        id: 'news_pce_hot',
        headline: "US core PCE runs hotter than consensus, lifting yields",
        summary:
          'The Fed’s preferred inflation gauge surprised to the upside, pushing US Treasury yields higher and supporting the dollar into Asia.',
        url: 'https://example.com/pce',
        source: 'Marketaux',
        assetTags: ['DXY', 'USDJPY', 'NAS100', 'SPX', 'XAUUSD'],
        publishedAt: t(7),
      },
      {
        id: 'news_jpy_intervention',
        headline: 'Japan MoF warns on ‘excessive’ FX moves as USD/JPY nears 160',
        summary:
          'Officials reiterated readiness to act against disorderly yen weakness, raising intervention risk near the 160 handle.',
        url: 'https://example.com/jpy',
        source: 'Reuters',
        assetTags: ['USDJPY'],
        publishedAt: t(4),
      },
      {
        id: 'news_oil_demand',
        headline: 'Crude slips as risk-off mood weighs on demand expectations',
        summary: 'WTI eased on broad risk aversion; no fresh supply catalyst reported.',
        url: 'https://example.com/oil',
        source: 'Finnhub',
        assetTags: ['WTI'],
        publishedAt: t(3),
      },
    ];
  }
}
