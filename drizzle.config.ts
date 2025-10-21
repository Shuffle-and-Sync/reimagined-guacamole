import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment variables from .env.local for development
const cwd = process.cwd();
if (cwd && process.env.NODE_ENV !== "production") {
  const envPath = resolve(cwd, ".env.local");
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

const databaseUrl =
  process.env.DATABASE_URL ||
  "sqlitecloud://cgqwvg83nk.g4.sqlite.cloud:8860/shuffleandsync?apikey=WXRy8ecObcGjMYRmuTT7bAEnvblToCbV4bHqUv8g6oQ";

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Extract auth token from URL if present (for SQLite Cloud / LibSQL compatibility)
function parseDbUrl(url: string): { url: string; authToken?: string } {
  try {
    const urlObj = new URL(url);
    const authToken = urlObj.searchParams.get("apikey");

    // Convert sqlitecloud:// to libsql:// for Turso driver compatibility
    // SQLite Cloud supports LibSQL protocol for drizzle-kit operations
    let baseUrl = url;
    if (url.startsWith("sqlitecloud://")) {
      // Extract host and database from URL
      const host = urlObj.hostname;
      const port = urlObj.port || "443"; // Use standard HTTPS port if not specified
      const pathname = urlObj.pathname;

      // Use libsql:// protocol for WebSocket connection (standard for LibSQL)
      baseUrl = `libsql://${host}${pathname}`;
    }

    // Remove apikey parameter from URL
    if (authToken) {
      const cleanUrl = new URL(baseUrl);
      cleanUrl.searchParams.delete("apikey");
      return {
        url: cleanUrl.toString(),
        authToken,
      };
    }

    return { url: baseUrl };
  } catch (error) {
    // If URL parsing fails, return as-is (for local file paths)
    return { url };
  }
}

const { url, authToken } = parseDbUrl(databaseUrl);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url,
    authToken,
  },
});
