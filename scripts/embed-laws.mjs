import pg from "pg";
import { SUPABASE_CA } from "../lib/supabase-ca.mjs";

const BATCH = 50;
const { DATABASE_URL, LLM_BASE_URL, LLM_API_KEY, EMBEDDING_MODEL = "gemini-embedding-001" } = process.env;

async function embedBatch(input) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${LLM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input, dimensions: 768 }),
    });
    if (response.ok) return (await response.json()).data.map((item) => item.embedding);
    if (attempt === 5) throw new Error(`Embedding failed with status ${response.status}`);
    // Free-tier limits reset each minute
    console.log(`Status ${response.status}, waiting 30 seconds`);
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { ca: SUPABASE_CA } });
await client.connect();
try {
  // Only rows without a vector, so a stopped run can simply be started again
  const { rows } = await client.query("SELECT id, text FROM law_sections WHERE embedding IS NULL ORDER BY id");
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const vectors = await embedBatch(batch.map((row) => row.text));
    for (const [index, row] of batch.entries()) {
      await client.query("UPDATE law_sections SET embedding = $1 WHERE id = $2", [JSON.stringify(vectors[index]), row.id]);
    }
    console.log(`Embedded ${start + batch.length} of ${rows.length}`);
  }
} finally {
  await client.end();
}
