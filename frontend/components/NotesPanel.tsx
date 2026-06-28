'use client';

import { useEffect, useState } from 'react';

interface LocalNote {
  id: string;
  body: string;
  createdAt: string;
}

/**
 * Personal notes. For the standalone MVP these persist to localStorage so the
 * dashboard is useful without a backend round-trip; wiring to the typed
 * /api/v1/notes endpoints is a drop-in for the connected build.
 */
export function NotesPanel({ briefingId }: { briefingId: string }) {
  const key = `zos-notes-${briefingId}`;
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);

  function persist(next: LocalNote[]) {
    setNotes(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  function add() {
    const body = draft.trim();
    if (!body) return;
    persist([{ id: crypto.randomUUID(), body, createdAt: new Date().toISOString() }, ...notes]);
    setDraft('');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="card">
        <textarea
          className="h-24 w-full resize-none rounded-lg border border-edge bg-panel2 p-2 text-sm outline-none focus:border-muted"
          placeholder="Add a note for this briefing…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={add}
            className="rounded-lg border border-edge bg-panel2 px-3 py-1.5 text-sm hover:border-muted"
          >
            Add note
          </button>
        </div>
      </div>
      {notes.length === 0 ? (
        <div className="card text-sm text-muted">No notes yet.</div>
      ) : (
        notes.map((n) => (
          <div key={n.id} className="card flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-200">{n.body}</p>
              <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <button
              onClick={() => persist(notes.filter((x) => x.id !== n.id))}
              className="text-xs text-muted hover:text-riskoff"
            >
              delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
