// Ładowanie ekranu (GET) w prototypie: stan "ładowanie" (c09), błąd z Try again (c08, c10). Dane są w pamięci, więc to tylko opóźnienie i błąd z symulacji.
import { useEffect, useState } from "react";

import type { ApiError } from "@devmentor/ui/backend/api/types";

import { loadGate } from "./sim/store";

export type Load = { status: "loading" | "ready" | "error"; error: ApiError | null; retry: () => void };

/** Uruchamia się przy wejściu na ekran i po "Try again"; jedno żądanie na raz. */
export function useLoad(baseDelay = 0): Load {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; error: ApiError | null } | null>(null);
  useEffect(() => {
    let alive = true;
    void loadGate(baseDelay).then((error) => {
      if (alive) setResult({ attempt, error });
    });
    return () => {
      alive = false;
    };
  }, [attempt, baseDelay]);
  const done = result !== null && result.attempt === attempt;
  return {
    status: !done ? "loading" : result.error ? "error" : "ready",
    error: done ? result.error : null,
    retry: () => setAttempt((value) => value + 1),
  };
}
