import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { pg: postgres.Sql | undefined };

const pg = globalForDb.pg ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  globalForDb.pg = pg;
}

export const db = drizzle(pg, { schema });
export type DB = typeof db;
