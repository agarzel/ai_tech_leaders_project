import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNow } from "./useNow";

describe("useNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T20:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("starts at the real time and refreshes every minute", () => {
    const { result } = renderHook(() => useNow());
    expect(result.current.toISOString()).toBe("2026-10-26T20:00:00.000Z");

    act(() => vi.advanceTimersByTime(60_000));

    expect(result.current.toISOString()).toBe("2026-10-26T20:01:00.000Z");
  });

  it("starts at a given time and runs on from it", () => {
    const { result } = renderHook(() => useNow(new Date("2026-01-01T10:00:00Z"), 30_000));
    expect(result.current.toISOString()).toBe("2026-01-01T10:00:00.000Z");

    act(() => vi.advanceTimersByTime(30_000));

    expect(result.current.toISOString()).toBe("2026-01-01T10:00:30.000Z");
  });

  it("stops refreshing when unmounted", () => {
    const { unmount } = renderHook(() => useNow());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
