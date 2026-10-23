import type { Clock } from "./clock";

export type RateLimiterOptions = {
  /** Attempts allowed per key within one window. */
  maxAttempts: number;
  windowMs: number;
};

export type RateLimitCheck = {
  allowed: boolean;
  /** When the current window ends and the key may try again (null when the key has no recorded attempts). */
  resetAt: Date | null;
};

type Window = { count: number; resetAt: number };

/**
 * Fixed-window limiter keyed by a string (e.g. an e-mail address). In-memory and per process:
 * a shared store (Redis, database) for multi-instance deployments is out of scope for now.
 * The policy (limits, what to key on) belongs to the caller, e.g. AuthService.
 */
export class RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly deps: { clock: Clock },
    private readonly options: RateLimiterOptions,
  ) {}

  /** Records one attempt (call it for each failed attempt). */
  record(key: string): void {
    const now = this.deps.clock.now().getTime();
    const current = this.activeWindow(key, now);
    if (current) {
      current.count += 1;
    } else {
      this.windows.set(key, { count: 1, resetAt: now + this.options.windowMs });
    }
  }

  /** Fail closed: `allowed` is false once the recorded attempts reach the maximum. */
  check(key: string): RateLimitCheck {
    const current = this.activeWindow(key, this.deps.clock.now().getTime());
    if (!current) return { allowed: true, resetAt: null };
    return { allowed: current.count < this.options.maxAttempts, resetAt: new Date(current.resetAt) };
  }

  /** Forgets a key, e.g. after a successful login. */
  reset(key: string): void {
    this.windows.delete(key);
  }

  private activeWindow(key: string, now: number): Window | undefined {
    const current = this.windows.get(key);
    if (current && current.resetAt > now) return current;
    this.windows.delete(key);
    return undefined;
  }
}
