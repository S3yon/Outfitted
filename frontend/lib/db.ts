import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";
import { join } from "path";

const dbPath = join(process.cwd(), "db", "outfitted.db");

const globalForDb = globalThis as unknown as { sqlite: Database.Database | undefined };

const sqlite = globalForDb.sqlite ?? new Database(dbPath);

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
