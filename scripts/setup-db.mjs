import { readFileSync } from "node:fs";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run: npm run db:setup");
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("Database schema is ready.");
} finally {
  await client.end();
}
