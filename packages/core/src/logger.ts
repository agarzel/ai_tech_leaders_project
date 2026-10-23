import pino, { type DestinationStream } from "pino";

// Never log secrets: these fields are replaced wherever they appear (top level or one level deep).
const REDACTED_FIELDS = ["password", "token", "jwt", "authorization", "cookie", "secret", "authSecret", "AUTH_SECRET"];

export function createLogger(destination?: DestinationStream) {
  return pino(
    {
      // Read directly (not via getEnv) so importing the logger never fails at build time.
      level: process.env.LOG_LEVEL ?? "info",
      redact: {
        paths: REDACTED_FIELDS.flatMap((field) => [field, `*.${field}`]),
        censor: "[redacted]",
      },
    },
    destination,
  );
}

export const logger = createLogger();

export type Logger = typeof logger;
