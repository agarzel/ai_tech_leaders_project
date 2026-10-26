"use client";

import { useSyncExternalStore } from "react";
import { browserTimeZone } from "@devmentor/ui/lib/time";

const subscribeNever = () => () => undefined;

/** The viewer's time zone, or `undefined` while rendering on the server (server and first client markup stay equal). */
export function useTimeZone(): string | undefined {
  return useSyncExternalStore(subscribeNever, browserTimeZone, () => undefined);
}
