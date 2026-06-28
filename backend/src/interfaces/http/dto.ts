import type { Briefing } from '../../domain/briefing/Briefing.js';
import type { PriceMove } from '../../domain/assets/PriceMove.js';

/**
 * Outbound DTO shapes — the typed contract the frontend (and later ZardoshtiOS)
 * consumes. Kept separate from domain entities so internal refactors don't break
 * the API surface.
 */
export function toMoveDto(m: PriceMove) {
  return {
    symbol: m.symbol,
    displayName: m.displayName,
    assetClass: m.assetClass,
    price: m.price,
    prevClose: m.prevClose,
    changeAbs: m.changeAbs,
    changePct: m.changePct,
    zscore: m.zscore,
    direction: m.direction,
    significant: m.significant,
    source: m.source,
    catalysts: m.catalysts.map((c) =>
      c.type === 'news'
        ? { type: 'news', id: c.item.id, headline: c.item.headline, source: c.item.source, url: c.item.url }
        : { type: 'event', id: c.event.id, title: c.event.title, impact: c.event.impact, source: c.event.source },
    ),
  };
}

export function toBriefingDto(b: Briefing) {
  return {
    id: b.id,
    briefingDate: b.briefingDate,
    kind: b.kind,
    status: b.status,
    model: b.model,
    generatedAt: b.generatedAt,
    riskSentiment: b.riskSentiment.label,
    riskBreakdown: b.riskSentiment.breakdown,
    sections: b.sections.map((s) => ({
      sectionNo: s.sectionNo,
      key: s.key,
      title: s.title,
      body: s.body,
      citations: s.citations,
    })),
    scenarios: b.scenarios,
    moves: b.moves.map(toMoveDto),
    dataCaveats: b.dataCaveats,
    dataQuality: b.snapshot.dataQuality,
    calendarToday: b.snapshot.calendarToday,
    window: b.snapshot.window,
  };
}

export function toBriefingSummaryDto(b: Briefing) {
  return {
    id: b.id,
    briefingDate: b.briefingDate,
    kind: b.kind,
    status: b.status,
    model: b.model,
    generatedAt: b.generatedAt,
    riskSentiment: b.riskSentiment.label,
    significantMoves: b.moves.filter((m) => m.significant).length,
  };
}
