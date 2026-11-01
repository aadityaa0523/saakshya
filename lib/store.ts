import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { LawCandidate, TriageResult } from "./agent";
import { chainIsValid, nextEntry, type ChainEntry } from "./chain";

export type Query = (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>; // eslint-disable-line @typescript-eslint/no-explicit-any

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function appendEvent(query: Query, reportId: string, event: unknown): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { rows } = await query("SELECT seq, at, event, previous, hash FROM report_events WHERE report_id = $1 ORDER BY seq DESC LIMIT 1", [reportId]);
    const entry = nextEntry(rows[0], event, new Date().toISOString());
    try {
      await query("INSERT INTO report_events (report_id, seq, at, event, previous, hash) VALUES ($1, $2, $3, $4, $5, $6)", [
        reportId, (rows[0]?.seq ?? 0) + 1, entry.at, JSON.stringify(entry.event), entry.previous, entry.hash,
      ]);
      return;
    } catch (error) {
      // two writers took the same seq: re-read the tail and try again
      if ((error as { code?: string }).code !== "23505") throw error;
    }
  }
  throw new Error("Could not record the event");
}

export async function createReport(query: Query, result: TriageResult, language: string, channel = "web") {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO reports (id, token_hash, language, story, fields, laws, draft, draft_translated, priority, urgency, channel) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [id, hashToken(token), language, result.story, JSON.stringify(result.fields), JSON.stringify(result.laws), result.draft, result.draftTranslated, result.priority, result.urgency, channel],
  );
  await appendEvent(query, id, { type: "report_created", priority: result.priority });
  return { id, token };
}

/** Returns null for both a wrong token and an unknown id, so ids cannot be probed. */
export async function getReport(query: Query, id: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await query("SELECT * FROM reports WHERE id = $1 AND token_hash = $2", [id, hashToken(token)]);
  return rows[0] ?? null;
}

export async function verifyChain(query: Query, id: string) {
  const { rows } = await query("SELECT at, event, previous, hash FROM report_events WHERE report_id = $1 ORDER BY seq", [id]);
  return { valid: chainIsValid(rows as ChainEntry[]), events: rows as ChainEntry[] };
}

export async function searchLaws(query: Query, terms: string): Promise<LawCandidate[]> {
  const { rows } = await query(
    `SELECT id, act, section, text, source_url FROM law_sections
     WHERE search @@ to_tsquery('english', $1)
     ORDER BY ts_rank(search, to_tsquery('english', $1)) DESC LIMIT 8`,
    [orQuery(terms)],
  );
  return rows;
}

function orQuery(terms: string): string {
  return terms.toLowerCase().match(/[a-z]{3,}/g)?.join(" | ") || "cheating";
}
