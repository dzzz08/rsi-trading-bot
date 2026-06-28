import type { Section } from '@/lib/types';

export function SectionView({ section }: { section: Section }) {
  const sources = dedupeSources(section);
  return (
    <div className="card">
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted">{String(section.sectionNo).padStart(2, '0')}</span>
        <h3 className="font-semibold">{section.title}</h3>
      </div>
      <p className="section-body mt-2">{section.body}</p>
      {sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-edge pt-2">
          {sources.map((s) => (
            <SourcePill key={s.refId} source={s.source} url={s.url} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourcePill({ source, url }: { source: string; url?: string }) {
  const cls = 'pill bg-edge text-muted hover:text-slate-200';
  return url ? (
    <a className={cls} href={url} target="_blank" rel="noreferrer">
      {source} ↗
    </a>
  ) : (
    <span className={cls}>{source}</span>
  );
}

function dedupeSources(section: Section) {
  const seen = new Set<string>();
  return section.citations.filter((c) => (seen.has(c.refId) ? false : (seen.add(c.refId), true)));
}
