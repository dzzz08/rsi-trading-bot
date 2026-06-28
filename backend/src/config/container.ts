import type { AppConfig } from './env.js';
import type {
  BriefingRepository,
  DeliveryChannel,
  EconomicCalendarProvider,
  LlmAnalyst,
  MarketDataProvider,
  NewsProvider,
  UserRepository,
  Clock,
} from '../domain/ports/index.js';

import { IngestionService } from '../application/ingestion/IngestionService.js';
import { MoveDetector } from '../application/analysis/MoveDetector.js';
import { RiskSentimentClassifier } from '../application/analysis/RiskSentimentClassifier.js';
import { ContextRetriever } from '../application/analysis/ContextRetriever.js';
import { OutputGuard } from '../application/analysis/OutputGuard.js';
import { GenerateBriefingUseCase } from '../application/briefing/GenerateBriefingUseCase.js';

import { MockMarketDataProvider } from '../infrastructure/providers/mock/MockMarketDataProvider.js';
import { MockNewsProvider } from '../infrastructure/providers/mock/MockNewsProvider.js';
import { MockEconomicCalendarProvider } from '../infrastructure/providers/mock/MockEconomicCalendarProvider.js';
import {
  RealMarketDataProvider,
  RealNewsProvider,
  RealEconomicCalendarProvider,
} from '../infrastructure/providers/real/RealProviders.js';
import { MockAnalyst } from '../infrastructure/llm/MockAnalyst.js';
import { AnthropicAnalyst } from '../infrastructure/llm/AnthropicAnalyst.js';
import { InMemoryBriefingRepository } from '../infrastructure/persistence/InMemoryBriefingRepository.js';
import {
  DEFAULT_USER,
  InMemoryUserRepository,
} from '../infrastructure/persistence/InMemoryUserRepository.js';
import { ConsoleDeliveryChannel } from '../infrastructure/delivery/ConsoleDeliveryChannel.js';
import {
  DiscordDeliveryChannel,
  EmailDeliveryChannel,
  TelegramDeliveryChannel,
} from '../infrastructure/delivery/StubDeliveryChannels.js';
import { SystemClock } from '../infrastructure/SystemClock.js';

/**
 * The composition root. The ONLY place that knows which concrete adapters back
 * each port. Everything else depends on interfaces. Swapping mock↔real, memory↔
 * postgres, console↔telegram, mock↔anthropic is a change here driven by config.
 */
export interface Container {
  readonly config: AppConfig;
  readonly defaultUserId: string;
  readonly clock: Clock;
  readonly briefingRepo: BriefingRepository;
  readonly userRepo: UserRepository;
  readonly analyst: LlmAnalyst;
  readonly delivery: DeliveryChannel;
  readonly generateBriefing: GenerateBriefingUseCase;
  /** Describes which adapters are wired — surfaced by /health. */
  readonly wiring: Record<string, string>;
}

export function buildContainer(config: AppConfig): Container {
  const clock = new SystemClock();

  const market: MarketDataProvider =
    config.DATA_SOURCE === 'real'
      ? new RealMarketDataProvider(config.TWELVE_DATA_API_KEY)
      : new MockMarketDataProvider();
  const news: NewsProvider =
    config.DATA_SOURCE === 'real'
      ? new RealNewsProvider(config.MARKETAUX_API_KEY)
      : new MockNewsProvider();
  const calendar: EconomicCalendarProvider =
    config.DATA_SOURCE === 'real'
      ? new RealEconomicCalendarProvider(config.TRADING_ECONOMICS_API_KEY)
      : new MockEconomicCalendarProvider();

  const analyst: LlmAnalyst =
    config.LLM_PROVIDER === 'anthropic'
      ? new AnthropicAnalyst({ apiKey: config.ANTHROPIC_API_KEY!, model: config.LLM_MODEL })
      : new MockAnalyst();

  // Persistence: in-memory for the MVP demo. The Postgres adapter slots in here
  // behind the same ports (docs/04 + backend/migrations/001_init.sql).
  const briefingRepo: BriefingRepository = new InMemoryBriefingRepository();
  const userRepo: UserRepository = new InMemoryUserRepository();

  const delivery: DeliveryChannel = pickDelivery(config.DELIVERY_CHANNEL);

  const ingestion = new IngestionService(market, news, calendar);
  const generateBriefing = new GenerateBriefingUseCase({
    ingestion,
    moveDetector: new MoveDetector(),
    riskClassifier: new RiskSentimentClassifier(),
    contextRetriever: new ContextRetriever(),
    guard: new OutputGuard(),
    analyst,
    briefingRepo,
    userRepo,
    delivery,
    clock,
    strictGuard: config.STRICT_GUARD,
    logger: (msg, meta) => console.error(`[generate] ${msg}`, meta ?? ''),
  });

  return {
    config,
    defaultUserId: DEFAULT_USER.id,
    clock,
    briefingRepo,
    userRepo,
    analyst,
    delivery,
    generateBriefing,
    wiring: {
      dataSource: config.DATA_SOURCE,
      marketProvider: market.name,
      newsProvider: news.name,
      calendarProvider: calendar.name,
      llm: analyst.model,
      persistence: config.PERSISTENCE,
      delivery: delivery.name,
    },
  };
}

function pickDelivery(channel: AppConfig['DELIVERY_CHANNEL']): DeliveryChannel {
  switch (channel) {
    case 'email':
      return new EmailDeliveryChannel();
    case 'telegram':
      return new TelegramDeliveryChannel();
    case 'discord':
      return new DiscordDeliveryChannel();
    case 'console':
    default:
      return new ConsoleDeliveryChannel();
  }
}
