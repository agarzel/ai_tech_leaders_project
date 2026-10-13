import { connection } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    await pool.query("SELECT 1");
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Database health check failed", error);
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
