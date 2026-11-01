// Asks for the database password without showing it, writes DATABASE_URL to .env.local and tests it.
import { readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import pg from "pg";
import { SUPABASE_CA } from "../lib/supabase-ca.mjs";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write("Paste your database password, then press Enter (it stays hidden): ");
rl._writeToOutput = () => {};
const password = await new Promise((resolve) => rl.once("line", resolve));
rl.close();
console.log();
if (!password.trim()) {
  console.log("No password entered. Nothing changed.");
  process.exit(1);
}

// Encoding means symbols in the password cannot break the address
const url = `postgresql://postgres.ckrcwpmnlhinkqthkybo:${encodeURIComponent(password.trim())}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: url, ssl: { ca: SUPABASE_CA }, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  await client.query("SELECT 1");
} catch (error) {
  console.log(error.code === "28P01" ? "Supabase rejected that password. Nothing changed. Reset it in database settings and try again." : `Could not connect (${error.code ?? error.name}). Nothing changed.`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
const file = new URL("../.env.local", import.meta.url);
writeFileSync(file, readFileSync(file, "utf8").replace(/^DATABASE_URL=.*$/m, () => `DATABASE_URL=${url}`));
console.log("Password works and is saved. Go back to the chat and say done.");
