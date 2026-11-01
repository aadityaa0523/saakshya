// Builds public/i18n/<code>.json from the site's own wording. Rerun after changing text; finished strings are kept.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LANGUAGES = { hi: "Hindi", bn: "Bengali", mr: "Marathi", te: "Telugu", ta: "Tamil", gu: "Gujarati", ur: "Urdu", kn: "Kannada", or: "Odia", ml: "Malayalam", pa: "Punjabi", as: "Assamese", ne: "Nepali", sd: "Sindhi" };
const BATCH = 70;
const { LLM_BASE_URL, LLM_MODEL, LLM_API_KEY } = process.env;

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return path.includes("api") ? [] : walk(path);
  return path.endsWith(".tsx") ? [path] : [];
});

export function extractStrings(source) {
  const found = new Set();
  const clean = (text) => text.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  // Text between JSX tags or expressions
  for (const match of source.matchAll(/[>}]([^<>{}]*[A-Za-z][^<>{}]*)[<{]/g)) found.add(clean(match[1]));
  // Quoted wording such as labels, placeholders and data arrays
  for (const match of source.matchAll(/["`]((?:[^"`\\$]|\\.){2,700})["`]/g)) {
    const text = clean(match[1].replace(/\\"/g, '"'));
    if (/^[A-Z][a-z]+$/.test(text) || (/ /.test(text) && /^[A-Z₹"“]/.test(text))) found.add(text);
  }
  return [...found].filter((text) => /[A-Za-z]{2}/.test(text) && text.length <= 700 && !/[=;$]|=>|https?:|^use |className|\(\)|\b(function|await|export|string\[\])\b|^\//.test(text));
}

async function translateBatch(language, strings) {
  const prompt = `Translate these website strings for Indian cybercrime victims into simple, respectful, everyday ${language}, in its usual script. Keep exactly as written: 1930, 112, 14416, 181, 1098, Saakshya, OTP, PIN, CVV, UPI, UTR, IFSC, PAN, Aadhaar, BNS, cybercrime.gov.in, ₹ and all numbers. Keep any leading or trailing punctuation. These are safety messages, so do not change their meaning. Return one JSON object whose keys are the exact original strings and whose values are the translations.\n${JSON.stringify(strings)}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${LLM_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: LLM_MODEL, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const content = (await response.json()).choices[0].message.content;
      return JSON.parse(content.match(/\{[\s\S]*\}/)[0]);
    } catch (error) {
      console.log(`  retry ${attempt + 1} (${error.message})`);
      await new Promise((resolve) => setTimeout(resolve, 20_000 * (attempt + 1)));
    }
  }
  return {};
}

const strings = [...new Set([...walk("app"), "lib/blog.ts", "lib/site.ts", "lib/actions.ts", "lib/agent.ts"].flatMap((file) => extractStrings(readFileSync(file, "utf8"))))];
console.log(`${strings.length} strings`);
if (process.argv.includes("--list")) {
  console.log(strings.join("\n"));
  process.exit(0);
}
mkdirSync("public/i18n", { recursive: true });
for (const [code, language] of Object.entries(LANGUAGES)) {
  const file = `public/i18n/${code}.json`;
  const done = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const todo = strings.filter((text) => !done[text]);
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const translated = await translateBatch(language, batch);
    for (const text of batch) if (typeof translated[text] === "string" && translated[text].trim()) done[text] = translated[text];
    writeFileSync(file, JSON.stringify(done));
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  console.log(`${language}: ${strings.filter((text) => done[text]).length} of ${strings.length}`);
}
