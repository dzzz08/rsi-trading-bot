import type { Clock } from '../domain/ports/index.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Fixed clock for deterministic tests/demos. */
export class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return this.fixed;
  }
}
