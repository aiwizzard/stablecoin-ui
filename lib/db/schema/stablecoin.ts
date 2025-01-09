import { sql } from "drizzle-orm";
import { text, integer } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

export const stablecoins = sqliteTable("stablecoins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  icon: text("icon").notNull(),
  targetCurrency: text("target_currency").notNull(),
  mintAddress: text("mint_address").notNull().unique(),
  creatorAddress: text("creator_address").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}); 