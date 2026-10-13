import { connection } from "next/server";
import { createRequestScope } from "@devmentor/core";

export async function GET() {
  await connection();

  const { healthService } = (await createRequestScope()).cradle;
  const health = await healthService.check();

  return Response.json(health, { status: health.status === "ok" ? 200 : 503 });
}
