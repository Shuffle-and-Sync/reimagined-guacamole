import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local for development
config({ path: resolve(process.cwd(), '.env.local') });

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
