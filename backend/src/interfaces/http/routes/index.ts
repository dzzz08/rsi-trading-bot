import { randomUUID } from 'node:crypto';
import { Router, type Express } from 'express';
import { z } from 'zod';
import type { Container } from '../../../config/container.js';
import { ASSET_UNIVERSE, findAsset } from '../../../domain/assets/Asset.js';
import { bearerAuth, schedulerAuth } from '../middleware/auth.js';
import { toBriefingDto, toBriefingSummaryDto, toMoveDto } from '../dto.js';

const ok = (data: unknown) => ({ data });
const err = (code: string, message: string) => ({ error: { code, message } });
const todayUtc = () => new Date().toISOString().slice(0, 10);

/** Wraps an async handler so rejections become 500s, not unhandled rejections. */
function h(fn: (req: any, res: any) => Promise<void>) {
  return (req: any, res: any) => {
    fn(req, res).catch((e: unknown) => {
      const message = e instanceof Error ? e.message : 'Internal error';
      res.status(500).json(err('internal_error', message));
    });
  };
}

export function registerRoutes(app: Express, c: Container): void {
  // Health is unauthenticated and reports wiring (mock vs real).
  app.get('/health', (_req, res) => {
    res.json(ok({ status: 'ok', wiring: c.wiring }));
  });

  // --- internal generate trigger (separate scheduler token) ---------------
  // Registered BEFORE the /api/v1 operator router so the operator bearer-auth
  // middleware does not shadow it (this route uses the scheduler token instead).
  app.post(
    '/api/v1/internal/briefings/generate',
    schedulerAuth(c.config.SCHEDULER_TOKEN),
    h(async (req, res) => {
      const parsed = z
        .object({
          date: z.string().optional(),
          kind: z.enum(['morning', 'intraday', 'eod']).optional(),
          dryRun: z.boolean().optional(),
        })
        .safeParse(req.body ?? {});
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'Invalid body'));
      const briefing = await c.generateBriefing.execute({
        userId: c.defaultUserId,
        date: parsed.data.date ?? todayUtc(),
        kind: parsed.data.kind ?? 'morning',
        dryRun: parsed.data.dryRun,
      });
      res.status(201).json(ok(toBriefingSummaryDto(briefing)));
    }),
  );

  const api = Router();

  // --- auth ---------------------------------------------------------------
  api.post(
    '/auth/login',
    h(async (req, res) => {
      const schema = z.object({ email: z.string().email(), token: z.string() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'email and token required'));
      if (parsed.data.token !== c.config.API_BEARER_TOKEN) {
        return void res.status(401).json(err('unauthorized', 'Invalid token'));
      }
      const user = await c.userRepo.getByEmail(parsed.data.email);
      res.json(ok({ token: c.config.API_BEARER_TOKEN, user: user ?? { id: c.defaultUserId } }));
    }),
  );

  // Everything below requires the operator bearer token.
  api.use(bearerAuth(c.config.API_BEARER_TOKEN, c.defaultUserId));

  api.get(
    '/auth/me',
    h(async (req, res) => {
      const user = await c.userRepo.getUser(req.userId);
      const prefs = await c.userRepo.getPreferences(req.userId);
      res.json(ok({ user, preferences: prefs }));
    }),
  );

  // --- briefings ----------------------------------------------------------
  api.get(
    '/briefings',
    h(async (req, res) => {
      const list = await c.briefingRepo.list(req.userId, {
        date: req.query.date as string | undefined,
        kind: req.query.kind as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(ok(list.map(toBriefingSummaryDto)));
    }),
  );

  api.get(
    '/briefings/latest',
    h(async (req, res) => {
      const b = await c.briefingRepo.findLatest(req.userId);
      if (!b) return void res.status(404).json(err('not_found', 'No briefings yet'));
      res.json(ok(toBriefingDto(b)));
    }),
  );

  api.get(
    '/briefings/:id',
    h(async (req, res) => {
      const b = await c.briefingRepo.findById(req.params.id);
      if (!b || b.userId !== req.userId) return void res.status(404).json(err('not_found', 'Briefing not found'));
      res.json(ok(toBriefingDto(b)));
    }),
  );

  api.get(
    '/briefings/:id/moves',
    h(async (req, res) => {
      const b = await c.briefingRepo.findById(req.params.id);
      if (!b || b.userId !== req.userId) return void res.status(404).json(err('not_found', 'Briefing not found'));
      res.json(ok(b.moves.map(toMoveDto)));
    }),
  );

  api.get(
    '/briefings/:id/compare',
    h(async (req, res) => {
      const a = await c.briefingRepo.findById(req.params.id);
      const other = await c.briefingRepo.findById(String(req.query.to ?? ''));
      if (!a || !other) return void res.status(404).json(err('not_found', 'One or both briefings not found'));
      res.json(
        ok({
          from: toBriefingSummaryDto(other),
          to: toBriefingSummaryDto(a),
          sentimentShift: { from: other.riskSentiment.label, to: a.riskSentiment.label },
          scoreDelta: a.riskSentiment.breakdown.score - other.riskSentiment.breakdown.score,
        }),
      );
    }),
  );

  // --- assets -------------------------------------------------------------
  api.get('/assets', (req, res) => {
    const cls = req.query.class as string | undefined;
    const assets = cls ? ASSET_UNIVERSE.filter((a) => a.assetClass === cls) : ASSET_UNIVERSE;
    res.json(ok(assets));
  });

  api.get(
    '/assets/:symbol/quote',
    h(async (req, res) => {
      const asset = findAsset(req.params.symbol.toUpperCase());
      if (!asset) return void res.status(404).json(err('not_found', 'Unknown asset'));
      const latest = await c.briefingRepo.findLatest(req.userId);
      const move = latest?.moves.find((m) => m.symbol === asset.symbol);
      res.json(ok({ asset, lastMove: move ? toMoveDto(move) : null, asOf: latest?.generatedAt ?? null }));
    }),
  );

  // --- calendar -----------------------------------------------------------
  api.get(
    '/calendar/today',
    h(async (req, res) => {
      const latest = await c.briefingRepo.findLatest(req.userId);
      res.json(ok(latest?.snapshot.calendarToday ?? []));
    }),
  );

  api.get(
    '/calendar',
    h(async (req, res) => {
      const date = (req.query.date as string | undefined) ?? todayUtc();
      const list = await c.briefingRepo.list(req.userId, { date });
      res.json(ok(list[0]?.snapshot.calendarToday ?? []));
    }),
  );

  // --- watchlist ----------------------------------------------------------
  api.get(
    '/watchlist',
    h(async (req, res) => res.json(ok(await c.userRepo.listWatchlist(req.userId)))),
  );

  api.post(
    '/watchlist',
    h(async (req, res) => {
      const parsed = z.object({ symbol: z.string() }).safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'symbol required'));
      const symbol = parsed.data.symbol.toUpperCase();
      if (!findAsset(symbol)) return void res.status(400).json(err('bad_request', 'Unknown symbol'));
      const existing = await c.userRepo.listWatchlist(req.userId);
      const item = { id: randomUUID(), userId: req.userId, symbol, sortOrder: existing.length, createdAt: new Date().toISOString() };
      await c.userRepo.addWatchlistItem(item);
      res.status(201).json(ok(item));
    }),
  );

  api.patch(
    '/watchlist/:id',
    h(async (req, res) => {
      const parsed = z.object({ sortOrder: z.number().int() }).safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'sortOrder required'));
      await c.userRepo.updateWatchlistItem(req.params.id, parsed.data.sortOrder);
      res.json(ok({ id: req.params.id }));
    }),
  );

  api.delete(
    '/watchlist/:id',
    h(async (req, res) => {
      await c.userRepo.removeWatchlistItem(req.params.id);
      res.json(ok({ id: req.params.id }));
    }),
  );

  // --- notes --------------------------------------------------------------
  api.get(
    '/notes',
    h(async (req, res) => res.json(ok(await c.userRepo.listNotes(req.userId, req.query.briefingId as string | undefined)))),
  );

  api.post(
    '/notes',
    h(async (req, res) => {
      const parsed = z.object({ body: z.string().min(1), briefingId: z.string().optional() }).safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'body required'));
      const note = { id: randomUUID(), userId: req.userId, briefingId: parsed.data.briefingId, body: parsed.data.body, createdAt: new Date().toISOString() };
      await c.userRepo.addNote(note);
      res.status(201).json(ok(note));
    }),
  );

  api.patch(
    '/notes/:id',
    h(async (req, res) => {
      const parsed = z.object({ body: z.string().min(1) }).safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'body required'));
      await c.userRepo.updateNote(req.params.id, parsed.data.body);
      res.json(ok({ id: req.params.id }));
    }),
  );

  api.delete(
    '/notes/:id',
    h(async (req, res) => {
      await c.userRepo.removeNote(req.params.id);
      res.json(ok({ id: req.params.id }));
    }),
  );

  // --- preferences --------------------------------------------------------
  api.get(
    '/preferences',
    h(async (req, res) => res.json(ok(await c.userRepo.getPreferences(req.userId)))),
  );

  api.put(
    '/preferences',
    h(async (req, res) => {
      const parsed = z
        .object({
          timezone: z.string(),
          sessionFocus: z.enum(['Asia', 'London', 'NewYork']),
          deliveryChannel: z.enum(['console', 'email', 'telegram', 'discord']),
          priorityAssets: z.array(z.string()),
        })
        .safeParse(req.body);
      if (!parsed.success) return void res.status(400).json(err('bad_request', 'Invalid preferences'));
      const prefs = { userId: req.userId, ...parsed.data, updatedAt: new Date().toISOString() };
      await c.userRepo.savePreferences(prefs);
      res.json(ok(prefs));
    }),
  );

  app.use('/api/v1', api);
}
