import { createHash, randomUUID } from "node:crypto";
import { appendEvent, type Query } from "./store";

export const MAX_EVIDENCE_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at about 4.5 MB
export const MAX_EVIDENCE_FILES = 10;
// These reports can involve intimate images, which this app must never hold
export const NO_UPLOAD_CATEGORY = "Women/Children Related Crime";

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

/** Trusts the file's own first bytes, never the name or the browser's stated type. */
export function sniffType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ascii(1, 4) === "PNG" && bytes[0] === 0x89) return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export async function addEvidence(query: Query, reportId: string, name: string, bytes: Uint8Array, mime: string) {
  const { rows } = await query("SELECT count(*)::int AS files FROM evidence WHERE report_id = $1", [reportId]);
  if (rows[0].files >= MAX_EVIDENCE_FILES) return null;
  const id = randomUUID();
  const hash = sha256(bytes);
  const safeName = name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "evidence";
  await query("INSERT INTO evidence (id, report_id, name, mime, size, sha256, data) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, reportId, safeName, mime, bytes.length, hash, bytes]);
  await appendEvent(query, reportId, { type: "evidence_added", name: safeName, sha256: hash });
  return { id, name: safeName, mime, size: bytes.length, sha256: hash };
}

export async function listEvidence(query: Query, reportId: string) {
  const { rows } = await query("SELECT id, name, mime, size, sha256, created_at FROM evidence WHERE report_id = $1 ORDER BY created_at", [reportId]);
  return rows;
}

/** Recomputes the fingerprint so a changed file is reported, not silently served. */
export async function getEvidence(query: Query, reportId: string, fileId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) return null;
  const { rows } = await query("SELECT name, mime, sha256, data FROM evidence WHERE id = $1 AND report_id = $2", [fileId, reportId]);
  if (!rows[0]) return null;
  const data = new Uint8Array(rows[0].data);
  return { name: rows[0].name as string, mime: rows[0].mime as string, data, intact: sha256(data) === rows[0].sha256 };
}

/** True when this client is over its limit for the last minute. */
export async function overLimit(query: Query, client: string, action: string, limit: number) {
  const key = sha256(new TextEncoder().encode(`${action}:${client}`));
  await query("DELETE FROM rate_hits WHERE at < now() - interval '1 minute'");
  const { rows } = await query("SELECT count(*)::int AS hits FROM rate_hits WHERE key = $1", [key]);
  if (rows[0].hits >= limit) return true;
  await query("INSERT INTO rate_hits (key) VALUES ($1)", [key]);
  return false;
}

export const clientOf = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
