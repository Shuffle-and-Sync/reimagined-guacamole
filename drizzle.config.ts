import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment variables from .env.local for development
const cwd = process.cwd();
if (cwd && process.env.NODE_ENV !== 'production') {
  const envPath = resolve(cwd, '.env.local');
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Use direct database URL for migrations if available, otherwise fall back to DATABASE_URL
const migrationUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
