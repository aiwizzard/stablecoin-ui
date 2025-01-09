import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_RPC_URL: z.string().optional(),
    NEXT_PUBLIC_SOLANA_NETWORK: z.enum(["mainnet", "devnet"]).default("devnet"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
