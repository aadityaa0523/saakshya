import { createHash } from "node:crypto";

export type ChainEntry = { at: string; event: unknown; previous: string; hash: string };

const GENESIS = "0".repeat(64);

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, sorted(v)]));
  }
  return value;
}

// jsonb reorders object keys, so the hash must not depend on key order
const digest = (at: string, event: unknown, previous: string) =>
  createHash("sha256").update(JSON.stringify({ at, event: sorted(event), previous })).digest("hex");

export function nextEntry(last: ChainEntry | undefined, event: unknown, at: string): ChainEntry {
  const previous = last?.hash ?? GENESIS;
  return { at, event, previous, hash: digest(at, event, previous) };
}

export function chainIsValid(entries: ChainEntry[]): boolean {
  let previous = GENESIS;
  for (const entry of entries) {
    if (entry.previous !== previous || entry.hash !== digest(entry.at, entry.event, entry.previous)) return false;
    previous = entry.hash;
  }
  return true;
}
