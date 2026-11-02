import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { PDFParse } from "pdf-parse";
import { SUPABASE_CA } from "../lib/supabase-ca.mjs";

export const ACTS = [
  { key: "bns", act: "Bharatiya Nyaya Sanhita 2023", file: "bns-2023.pdf", source_url: "https://www.indiacode.nic.in/handle/123456789/20062" },
  { key: "it", act: "Information Technology Act 2000", file: "it-act-2000.pdf", source_url: "https://www.indiacode.nic.in/handle/123456789/1999" },
];

// A section heading ends in a dash and can wrap over lines. Contents-page lines have no dash
// before the next numbered line, so they are skipped. Amended sections start with a footnote mark, as in "6[66."
const HEADING = /^\s*(?:\d{0,2}\[)?(\d{1,3}[A-Z]{0,2})\.\s+(?:\d{0,2}\[)?([A-Z](?:(?!\n\s*\d{1,3}[A-Z]{0,2}\.\s)[^—–]){2,300}?)\.?\s*[—–]{1,2}\s*/gm;

export function parseSections(text) {
  const headings = [...text.matchAll(HEADING)];
  const sections = new Map();
  headings.forEach((match, index) => {
    const end = headings[index + 1]?.index ?? text.length;
    const body = text.slice(match.index, end).replace(/\s+/g, " ").trim();
    // Later text can repeat a number in a schedule; the first real heading is the section
    if (!sections.has(match[1]) && body.length > 40) sections.set(match[1], body.slice(0, 6000));
  });
  return sections;
}

export async function readAct({ file }) {
  const data = readFileSync(new URL(`../laws/${file}`, import.meta.url));
  const { text } = await new PDFParse({ data }).getText();
  return parseSections(text);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const client = dryRun ? null : new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { ca: SUPABASE_CA } });
  await client?.connect();
  try {
    for (const act of ACTS) {
      const sections = await readAct(act);
      for (const [section, text] of sections) {
        await client?.query(
          `INSERT INTO law_sections (id, act, section, text, source_url) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, source_url = EXCLUDED.source_url,
             embedding = CASE WHEN law_sections.text = EXCLUDED.text THEN law_sections.embedding END`,
          [`${act.key}-${section}`, act.act, section, text, act.source_url],
        );
      }
      console.log(`${act.act}: ${sections.size} sections${dryRun ? " (dry run)" : " loaded"}`);
    }
  } finally {
    await client?.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
