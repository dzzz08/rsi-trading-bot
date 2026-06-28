import type { RiskLabel } from '@/lib/types';

export function pct(p: number): string {
  const v = p * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function price(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(4);
}

export function hhmm(iso: string): string {
  return new Date(iso).toISOString().slice(11, 16);
}

export function riskLabelText(l: RiskLabel): string {
  return l === 'risk_on' ? 'RISK-ON' : l === 'risk_off' ? 'RISK-OFF' : 'MIXED';
}

export function riskColor(l: RiskLabel): string {
  return l === 'risk_on' ? 'bg-riskon/15 text-riskon' : l === 'risk_off' ? 'bg-riskoff/15 text-riskoff' : 'bg-mixed/15 text-mixed';
}

export function moveColor(direction: string): string {
  return direction === 'up' ? 'text-riskon' : direction === 'down' ? 'text-riskoff' : 'text-muted';
}

export function impactColor(impact: string): string {
  return impact === 'high' ? 'bg-riskoff/15 text-riskoff' : impact === 'medium' ? 'bg-mixed/15 text-mixed' : 'bg-edge text-muted';
}
