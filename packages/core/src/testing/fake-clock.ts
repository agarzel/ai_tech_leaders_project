import type { Clock } from "../clock";

/** Test double: time stands still until `advance` is called. */
export class FakeClock implements Clock {
  private current: number;

  constructor(start: Date = new Date("2026-01-01T00:00:00Z")) {
    this.current = start.getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current += ms;
  }
}
