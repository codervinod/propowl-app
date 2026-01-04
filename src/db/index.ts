import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Handle missing DATABASE_URL during build time
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Return a dummy db object during build to prevent errors
  // This is safe because database operations only happen at runtime
  console.warn("DATABASE_URL not set - using placeholder for build");
}

const sql = connectionString ? neon(connectionString) : null;
export const db = sql ? drizzle(sql, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

export * from "./schema";
