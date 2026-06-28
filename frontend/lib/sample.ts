// AUTO-GENERATED sample briefing (from the backend mock pipeline) so the
// dashboard renders standalone without a running backend. Regenerate via
// backend `tsx src/scripts/dump-sample.ts`. Illustrative data — not advice.
import type { Briefing } from './types';

export const SAMPLE_BRIEFING: Briefing = {
  "id": "sample-2026-06-29",
  "briefingDate": "2026-06-29",
  "kind": "morning",
  "status": "ready",
  "model": "sample",
  "generatedAt": "2026-06-29T05:30:00.000Z",
  "riskSentiment": "risk_off",
  "riskBreakdown": {
    "equities": -1,
    "crypto": -1,
    "dxy": -1,
    "jpy": 1,
    "gold": -1,
    "yields": 1,
    "score": -2
  },
  "sections": [
    {
      "sectionNo": 1,
      "key": "overnight_summary",
      "title": "Overnight Summary",
      "body": "Into the London handover the tape reads risk-off. The notable moves: Gold +1.20%, USD/JPY +0.50%, Ethereum -3.10%, Bitcoin -2.40%. Direction is consistent across asset classes rather than a single-headline shock; see the per-asset mechanism below.",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        }
      ]
    },
    {
      "sectionNo": 2,
      "key": "why_assets_moved",
      "title": "Why Assets Moved",
      "body": "\u2022 Gold +1.20% (z=2): Gold\u2019s move reflects haven demand and rate expectations. Catalyst: US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 USD/JPY +0.50% (z=1.44): Driven by the US\u2013JP rate differential and carry positioning. Catalyst: US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 Ethereum -3.10% (z=-1.03): no clear catalyst in window \u2014 read as positioning/flow. Crypto is trading as high-beta risk.\n\u2022 Bitcoin -2.40% (z=-0.96): no clear catalyst in window \u2014 read as positioning/flow. Crypto is trading as high-beta risk.\n\u2022 Nasdaq 100 -0.70% (z=-0.87): Long-duration equities are sensitive to the discount rate. Catalyst: US core PCE runs hotter than consensus, lifting yields (Marketaux).",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        },
        {
          "type": "news",
          "refId": "news_jpy_intervention",
          "source": "Reuters",
          "url": "https://example.com/jpy"
        }
      ]
    },
    {
      "sectionNo": 3,
      "key": "macro_drivers",
      "title": "Macro Drivers & Catalysts",
      "body": "The threads driving the session:\n\u2022 US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 Japan MoF warns on \u2018excessive\u2019 FX moves as USD/JPY nears 160 (Reuters).",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        },
        {
          "type": "news",
          "refId": "news_jpy_intervention",
          "source": "Reuters",
          "url": "https://example.com/jpy"
        }
      ]
    },
    {
      "sectionNo": 4,
      "key": "fx",
      "title": "FX",
      "body": "\u2022 USD/JPY: 159.40 (+0.50%) \u2014 US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 US Dollar Index: 104.20 (+0.35%) \u2014 within noise.\n\u2022 GBP/USD: 1.2640 (-0.30%) \u2014 within noise.\n\u2022 EUR/USD: 1.0710 (-0.25%) \u2014 within noise.",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "news",
          "refId": "news_jpy_intervention",
          "source": "Reuters",
          "url": "https://example.com/jpy"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "sectionNo": 5,
      "key": "commodities",
      "title": "Commodities",
      "body": "\u2022 Gold: 2,418 (+1.20%) \u2014 US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 Crude Oil (WTI): 81.1000 (-0.60%) \u2014 within noise.",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "sectionNo": 6,
      "key": "indices",
      "title": "Indices",
      "body": "\u2022 Nasdaq 100: 18,917 (-0.70%) \u2014 US core PCE runs hotter than consensus, lifting yields (Marketaux).\n\u2022 S&P 500: 5,447 (-0.49%) \u2014 within noise.\n\u2022 Dow Jones: 39,050 (-0.30%) \u2014 within noise.\n\u2022 DAX 40: 18,160 (-0.40%) \u2014 within noise.",
      "citations": [
        {
          "type": "news",
          "refId": "news_pce_hot",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "sectionNo": 7,
      "key": "crypto",
      "title": "Crypto",
      "body": "\u2022 Ethereum: 3,310 (-3.10%) \u2014 no catalyst in window; positioning/flow.\n\u2022 Bitcoin: 60,150 (-2.40%) \u2014 no catalyst in window; positioning/flow.",
      "citations": []
    },
    {
      "sectionNo": 8,
      "key": "risk_sentiment",
      "title": "Risk Sentiment",
      "body": "Deterministic read: RISK-OFF (score -2). Component votes \u2014 equities -1, crypto -1, DXY -1, JPY +1, gold -1, yields +1. This is a rule-based classification (see the methodology); the prose explains it and does not overrule it.",
      "citations": []
    },
    {
      "sectionNo": 9,
      "key": "economic_calendar",
      "title": "Economic Calendar",
      "body": "\u2022 10:00 \u2014 Euro Area Flash CPI (YoY) [HIGH] (EZ), fcst 2.5, prev 2.6.\n\u2022 14:00 \u2014 US Consumer Confidence [HIGH] (US), fcst 99.5, prev 100.4.\n\u2022 15:00 \u2014 FOMC Member Speaks [MEDIUM] (US).",
      "citations": [
        {
          "type": "event",
          "refId": "evt_ez_cpi",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "sectionNo": 10,
      "key": "key_levels",
      "title": "Key Levels & Liquidity",
      "body": "\u2022 Gold: prior close 2,389, now 2,418.\n\u2022 USD/JPY: prior close 158.60, now 159.40.\n\u2022 Ethereum: prior close 3,416, now 3,310.\n\u2022 Bitcoin: prior close 61,630, now 60,150.\n\u2022 Nasdaq 100: prior close 19,050, now 18,917.\nVWAP / volume-profile / liquidity-zone data is unavailable in this snapshot and is not fabricated (see roadmap Phase 3).",
      "citations": []
    },
    {
      "sectionNo": 11,
      "key": "scenarios",
      "title": "Scenarios",
      "body": "BULL \u2014 Risk stabilises and the overnight move unwinds intraday.\n  Conditions: If Euro Area Flash CPI (YoY) comes in supportive and yields ease, then the dollar rolls over and equities/crypto recover.\n  Invalidation: A fresh hawkish catalyst or another hot data print that re-accelerates yields.\n\nBEAR \u2014 The prevailing regime extends through the session.\n  Conditions: If Euro Area Flash CPI (YoY) disappoints and yields stay bid, then the dollar firms further and risk stays offered.\n  Invalidation: A dovish surprise or a sharp reversal lower in yields/DXY.\n\nCHOP \u2014 Consolidation of the overnight move with no clean trend.\n  Conditions: If Euro Area Flash CPI (YoY) lands near consensus, then expect range-trading as the risk-off move digests until the US cash session.\n  Invalidation: A decisive break of the overnight range in either direction on volume.",
      "citations": []
    },
    {
      "sectionNo": 12,
      "key": "what_matters",
      "title": "What Actually Matters Today",
      "body": "A risk-off tape; the assets in focus are Gold and USD/JPY. The key swing factor today is Euro Area Flash CPI (YoY) at 10:00. Trade the reaction, not the prediction.",
      "citations": []
    },
    {
      "sectionNo": 13,
      "key": "risk_warnings",
      "title": "Risk Warnings",
      "body": "\u2022 10:00 \u2014 Euro Area Flash CPI (YoY): high-impact; expect a volatility spike.\n\u2022 14:00 \u2014 US Consumer Confidence: high-impact; expect a volatility spike.",
      "citations": [
        {
          "type": "event",
          "refId": "evt_ez_cpi",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_us_confidence",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "refId": "evt_fed_speaker",
          "source": "mock-calendar"
        }
      ]
    }
  ],
  "scenarios": [
    {
      "kind": "bull",
      "thesis": "Risk stabilises and the overnight move unwinds intraday.",
      "conditions": [
        "If Euro Area Flash CPI (YoY) comes in supportive and yields ease, then the dollar rolls over and equities/crypto recover."
      ],
      "invalidation": [
        "A fresh hawkish catalyst or another hot data print that re-accelerates yields."
      ]
    },
    {
      "kind": "bear",
      "thesis": "The prevailing regime extends through the session.",
      "conditions": [
        "If Euro Area Flash CPI (YoY) disappoints and yields stay bid, then the dollar firms further and risk stays offered."
      ],
      "invalidation": [
        "A dovish surprise or a sharp reversal lower in yields/DXY."
      ]
    },
    {
      "kind": "chop",
      "thesis": "Consolidation of the overnight move with no clean trend.",
      "conditions": [
        "If Euro Area Flash CPI (YoY) lands near consensus, then expect range-trading as the risk-off move digests until the US cash session."
      ],
      "invalidation": [
        "A decisive break of the overnight range in either direction on volume."
      ]
    }
  ],
  "moves": [
    {
      "symbol": "XAUUSD",
      "displayName": "Gold",
      "assetClass": "commodity",
      "price": 2418,
      "prevClose": 2389.3,
      "changeAbs": 28.7,
      "changePct": 0.01201,
      "zscore": 2,
      "direction": "up",
      "significant": true,
      "source": "mock-market-data",
      "catalysts": [
        {
          "type": "news",
          "id": "news_pce_hot",
          "headline": "US core PCE runs hotter than consensus, lifting yields",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "id": "evt_us_confidence",
          "title": "US Consumer Confidence",
          "impact": "high",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "id": "evt_fed_speaker",
          "title": "FOMC Member Speaks",
          "impact": "medium",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "symbol": "USDJPY",
      "displayName": "USD/JPY",
      "assetClass": "fx",
      "price": 159.4,
      "prevClose": 158.6,
      "changeAbs": 0.8,
      "changePct": 0.00504,
      "zscore": 1.44,
      "direction": "up",
      "significant": true,
      "source": "mock-market-data",
      "catalysts": [
        {
          "type": "news",
          "id": "news_pce_hot",
          "headline": "US core PCE runs hotter than consensus, lifting yields",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "news",
          "id": "news_jpy_intervention",
          "headline": "Japan MoF warns on \u2018excessive\u2019 FX moves as USD/JPY nears 160",
          "source": "Reuters",
          "url": "https://example.com/jpy"
        },
        {
          "type": "event",
          "id": "evt_us_confidence",
          "title": "US Consumer Confidence",
          "impact": "high",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "id": "evt_fed_speaker",
          "title": "FOMC Member Speaks",
          "impact": "medium",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "symbol": "ETHUSD",
      "displayName": "Ethereum",
      "assetClass": "crypto",
      "price": 3310,
      "prevClose": 3416,
      "changeAbs": -106,
      "changePct": -0.03103,
      "zscore": -1.03,
      "direction": "down",
      "significant": true,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "BTCUSD",
      "displayName": "Bitcoin",
      "assetClass": "crypto",
      "price": 60150,
      "prevClose": 61630,
      "changeAbs": -1480,
      "changePct": -0.02401,
      "zscore": -0.96,
      "direction": "down",
      "significant": true,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "NAS100",
      "displayName": "Nasdaq 100",
      "assetClass": "index",
      "price": 18917,
      "prevClose": 19050,
      "changeAbs": -133,
      "changePct": -0.00698,
      "zscore": -0.87,
      "direction": "down",
      "significant": true,
      "source": "mock-market-data",
      "catalysts": [
        {
          "type": "news",
          "id": "news_pce_hot",
          "headline": "US core PCE runs hotter than consensus, lifting yields",
          "source": "Marketaux",
          "url": "https://example.com/pce"
        },
        {
          "type": "event",
          "id": "evt_us_confidence",
          "title": "US Consumer Confidence",
          "impact": "high",
          "source": "mock-calendar"
        },
        {
          "type": "event",
          "id": "evt_fed_speaker",
          "title": "FOMC Member Speaks",
          "impact": "medium",
          "source": "mock-calendar"
        }
      ]
    },
    {
      "symbol": "DXY",
      "displayName": "US Dollar Index",
      "assetClass": "fx",
      "price": 104.2,
      "prevClose": 103.84,
      "changeAbs": 0.36,
      "changePct": 0.00347,
      "zscore": 1.16,
      "direction": "up",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "GBPUSD",
      "displayName": "GBP/USD",
      "assetClass": "fx",
      "price": 1.264,
      "prevClose": 1.2678,
      "changeAbs": -0.0038,
      "changePct": -0.003,
      "zscore": -0.86,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "EURUSD",
      "displayName": "EUR/USD",
      "assetClass": "fx",
      "price": 1.071,
      "prevClose": 1.0737,
      "changeAbs": -0.0027,
      "changePct": -0.00251,
      "zscore": -0.84,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "SPX",
      "displayName": "S&P 500",
      "assetClass": "index",
      "price": 5447,
      "prevClose": 5474,
      "changeAbs": -27,
      "changePct": -0.00493,
      "zscore": -0.82,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "DJI",
      "displayName": "Dow Jones",
      "assetClass": "index",
      "price": 39050,
      "prevClose": 39167,
      "changeAbs": -117,
      "changePct": -0.00299,
      "zscore": -0.6,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "DAX",
      "displayName": "DAX 40",
      "assetClass": "index",
      "price": 18160,
      "prevClose": 18233,
      "changeAbs": -73,
      "changePct": -0.004,
      "zscore": -0.57,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    },
    {
      "symbol": "WTI",
      "displayName": "Crude Oil (WTI)",
      "assetClass": "commodity",
      "price": 81.1,
      "prevClose": 81.59,
      "changeAbs": -0.49,
      "changePct": -0.00601,
      "zscore": -0.5,
      "direction": "down",
      "significant": false,
      "source": "mock-market-data",
      "catalysts": []
    }
  ],
  "dataCaveats": [
    "VWAP/volume-profile/liquidity data not available in this snapshot."
  ],
  "dataQuality": {
    "marketData": "ok",
    "news": "ok",
    "calendar": "ok"
  },
  "calendarToday": [
    {
      "id": "evt_ez_cpi",
      "title": "Euro Area Flash CPI (YoY)",
      "country": "EZ",
      "impact": "high",
      "scheduledAt": "2026-06-29T10:00:00Z",
      "forecast": 2.5,
      "previous": 2.6,
      "actual": null,
      "source": "mock-calendar"
    },
    {
      "id": "evt_us_confidence",
      "title": "US Consumer Confidence",
      "country": "US",
      "impact": "high",
      "scheduledAt": "2026-06-29T14:00:00Z",
      "forecast": 99.5,
      "previous": 100.4,
      "actual": null,
      "source": "mock-calendar"
    },
    {
      "id": "evt_fed_speaker",
      "title": "FOMC Member Speaks",
      "country": "US",
      "impact": "medium",
      "scheduledAt": "2026-06-29T15:00:00Z",
      "forecast": null,
      "previous": null,
      "actual": null,
      "source": "mock-calendar"
    }
  ],
  "window": {
    "from": "2026-06-28T21:00:00.000Z",
    "to": "2026-06-29T05:30:00Z",
    "label": "prior NY close \u2192 05:30 London"
  }
} as Briefing;
