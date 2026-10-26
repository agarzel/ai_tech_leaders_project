import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  // Signs session tokens. Required, no default (fail closed); generate with `openssl rand -base64 32`.
  AUTH_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // Exactly one payment provider per process; required, no default (fail closed). `fake` is for development and tests only.
  PAYMENTS_PROVIDER: z.enum(["stripe", "fake"]),
  // Required only when PAYMENTS_PROVIDER is `stripe` (checked below). No defaults for secrets.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  // Protects the sweep endpoint and signs the fake provider's webhook events; generate with `openssl rand -base64 32`.
  SWEEP_SECRET: z.string().min(32),
  // Public base URL of the app; Checkout success and cancel URLs are built from it.
  APP_URL: z.url({ protocol: /^https?$/ }),
});

const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.PAYMENTS_PROVIDER === "fake" && env.NODE_ENV === "production") {
    ctx.addIssue({ code: "custom", path: ["PAYMENTS_PROVIDER"], message: "the fake provider is refused in production" });
  }
  if (env.PAYMENTS_PROVIDER === "stripe") {
    for (const key of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const) {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "required when PAYMENTS_PROVIDER is stripe" });
    }
  }
});

export type Env = z.infer<typeof baseSchema>;

let cachedEnv: Env | undefined;

/** Validated environment. Throws on first use if a variable is missing or invalid (values are never printed). */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment variables:\n  ${problems.join("\n  ")}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
