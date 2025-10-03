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

const databaseUrl = process.env.DATABASE_URL || "sqlitecloud://cgqwvg83nk.g4.sqlite.cloud:8860/shuffleandsync?apikey=WXRy8ecObcGjMYRmuTT7bAEnvblToCbV4bHqUv8g6oQ";

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});
