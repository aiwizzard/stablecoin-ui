import type { Config } from "drizzle-kit";
import { env } from "@/lib/env.mjs";

export default {
  schema: "./lib/db/schema",
  dialect: "turso",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  }
} satisfies Config;