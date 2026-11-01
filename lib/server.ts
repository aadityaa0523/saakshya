import { Pool } from "pg";
import type { Tools } from "./agent";
import { askLlm } from "./llm";
import { searchLaws, type Query } from "./store";

let pool: Pool | undefined;

export const query: Query = (sql, params) => {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return pool.query(sql, params as unknown[]);
};

async function lookupIfsc(ifsc: string) {
  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const body = await response.json();
    return { bank: String(body.BANK), branch: String(body.BRANCH) };
  } catch {
    return null;
  }
}

export const tools: Tools = { ask: askLlm, searchLaws: (terms) => searchLaws(query, terms), lookupIfsc };
