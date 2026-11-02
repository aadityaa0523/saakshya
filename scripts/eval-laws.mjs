// Compares keyword search with hybrid search on made-up cases, using the production search query.
import pg from "pg";
import { hybridSearchSql, keywordSearchSql, orQuery } from "../lib/law-search.mjs";
import { SUPABASE_CA } from "../lib/supabase-ca.mjs";

const { DATABASE_URL, LLM_BASE_URL, LLM_API_KEY, EMBEDDING_MODEL = "gemini-embedding-001" } = process.env;

// [what happened, keywords a model might extract, sections a correct search should return]
const CASES = [
  ["A caller claimed to be from my bank and got me to send money by UPI.", "bank fraud money", ["bns-318", "bns-319", "it-66D"]],
  ["A fake trading app on Telegram showed profits and took my investment.", "investment scam app", ["bns-318"]],
  ["Someone made a fake profile using my photos and name and messages my friends.", "fake profile photos", ["it-66C", "it-66D"]],
  ["A person threatens to post my private video unless I pay them.", "blackmail private video", ["bns-308", "bns-351", "it-67A"]],
  ["He sends me sexual pictures and will not stop following me online.", "harassment pictures", ["bns-75", "bns-78", "it-67A"]],
  ["Someone secretly filmed me changing clothes and shared the clip.", "secret recording", ["bns-77", "it-66E"]],
  ["My email account was broken into and my password was changed.", "account hacked", ["it-66", "it-43"]],
  ["Police impersonators kept me on a video call and said I was under digital arrest.", "digital arrest police", ["bns-319", "bns-204", "bns-308"]],
  ["They sent a link pretending to be a courier company and stole my card money.", "courier link phishing", ["bns-318", "it-66D"]],
  ["A shop on Instagram took payment and never delivered the phone I ordered.", "online shopping not delivered", ["bns-318"]],
  ["Child sexual images of a minor were sent to our group.", "child images", ["it-67B"]],
  ["They forged a government letter with a court stamp and demanded a fee.", "fake letter fee", ["bns-336", "bns-318"]],
];

async function embed(text) {
  const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${LLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: [text], dimensions: 768 }),
  });
  if (!response.ok) throw new Error(`Embedding failed with status ${response.status}`);
  return JSON.stringify((await response.json()).data[0].embedding);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { ca: SUPABASE_CA } });
await client.connect();
try {
  const totals = { keyword: 0, hybrid: 0, wanted: 0, keywordFirst: 0, hybridFirst: 0 };
  for (const [story, terms, wanted] of CASES) {
    const keyword = (await client.query(keywordSearchSql, [orQuery(terms)])).rows.map((row) => row.id);
    const hybrid = (await client.query(hybridSearchSql, [orQuery(terms), await embed(story)])).rows.map((row) => row.id);
    const found = (ids) => wanted.filter((id) => ids.includes(id));
    totals.wanted += wanted.length;
    totals.keyword += found(keyword).length;
    totals.hybrid += found(hybrid).length;
    totals.keywordFirst += wanted.includes(keyword[0]) ? 1 : 0;
    totals.hybridFirst += wanted.includes(hybrid[0]) ? 1 : 0;
    console.log(`${found(keyword).length}/${wanted.length} -> ${found(hybrid).length}/${wanted.length}  ${story}`);
  }
  console.log(`\nFound in top 12: keyword ${totals.keyword}/${totals.wanted}, hybrid ${totals.hybrid}/${totals.wanted}`);
  console.log(`Correct first result: keyword ${totals.keywordFirst}/${CASES.length}, hybrid ${totals.hybridFirst}/${CASES.length}`);
} finally {
  await client.end();
}
