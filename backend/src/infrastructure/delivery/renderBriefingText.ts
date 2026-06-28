import type { Briefing } from '../../domain/briefing/Briefing.js';

/**
 * Render a briefing as plain text / markdown. Shared by the console delivery
 * channel and the demo script. Channel-specific formatting (HTML email,
 * Telegram markdown) belongs in each channel adapter; this is the neutral base.
 */
export function renderBriefingText(b: Briefing): string {
  const lines: string[] = [];
  const sentiment = b.riskSentiment.label.replace('_', '-').toUpperCase();
  lines.push('='.repeat(72));
  lines.push(`ZardoshtiOS — Morning Briefing · ${b.briefingDate} · ${b.kind} · model:${b.model}`);
  lines.push(`Risk sentiment: ${sentiment} (score ${b.riskSentiment.breakdown.score})`);
  lines.push('='.repeat(72));

  for (const s of [...b.sections].sort((a, c) => a.sectionNo - c.sectionNo)) {
    lines.push('');
    lines.push(`${s.sectionNo}. ${s.title}`);
    lines.push('-'.repeat(s.title.length + 4));
    lines.push(s.body);
    if (s.citations.length > 0) {
      const cites = s.citations.map((c) => `${c.source}${c.url ? ` <${c.url}>` : ''}`).join('; ');
      lines.push(`   Sources: ${cites}`);
    }
  }

  if (b.dataCaveats.length > 0) {
    lines.push('');
    lines.push('Data caveats:');
    for (const c of b.dataCaveats) lines.push(`  • ${c}`);
  }
  lines.push('');
  lines.push('Not advice. Research/analyst context only — no buy/sell instructions.');
  return lines.join('\n');
}
