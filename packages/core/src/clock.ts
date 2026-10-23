/** Source of the current time; inject it so time-dependent logic is testable. */
export interface Clock {
  now(): Date;
}

export const realClock: Clock = { now: () => new Date() };
