import { z } from "zod";
import type { AskLlm } from "./llm";
import { wrapStory } from "./llm";
import { sanitize, urgencyOf, type Identifiers, type Urgency } from "./safety";

export const CATEGORIES = ["Financial Fraud", "Women/Children Related Crime", "Extortion & Blackmail", "Identity Theft", "E-Commerce Scam", "Other Cyber Crime", "Not Cybercrime"] as const;

const Extraction = z.object({
  category: z.enum(CATEGORIES),
  amount: z.number().nonnegative().nullable(),
  bank_name: z.string().max(100).nullable(),
  complainant_name: z.string().max(100).nullable().optional(),
  scammer_name: z.string().max(120).nullable().optional(),
  transactions: z.array(z.object({ amount: z.number().nonnegative(), from_bank: z.string().max(100).nullable().optional(), to: z.string().max(120).nullable().optional() })).max(20).nullable().optional(),
  summary_en: z.string().max(600),
  // Models differ on whether they send keywords as text or as a list
  search_terms: z.union([z.string(), z.array(z.string())]).transform((terms) => [terms].flat().join(" ").slice(0, 200)),
  question: z.string().max(300),
});
const LawPicks = z.object({ picks: z.array(z.object({ id: z.string(), reason: z.string().max(300) })).max(4) });
const Draft = z.object({ complaint_en: z.string().min(50), complaint_translated: z.string() });

export type LawCandidate = { id: string; act: string; section: string; text: string; source_url: string };
export type Transaction = { amount: number; from_bank?: string | null; to?: string | null };
export type Fields = Identifiers & { category: string; amount: number | null; bank_name: string | null; bank_branch: string | null; summary: string; transactions?: Transaction[]; complainant_name?: string | null; scammer_name?: string | null };
export type Step = { tool: string; status: "ok" | "failed" | "skipped"; detail: string };
export type Tools = {
  ask: AskLlm;
  searchLaws: (terms: string) => Promise<LawCandidate[]>;
  lookupIfsc: (ifsc: string) => Promise<{ bank: string; branch: string } | null>;
};
export type TriageResult = {
  urgency: Urgency;
  story: string;
  fields: Fields;
  laws: (LawCandidate & { reason: string })[];
  draft: string | null;
  draftTranslated: string | null;
  draftError: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  missing: string[];
  question: string;
};

const PROMISES = /\b(guarantee\w*|will (get|receive) (a |your |the )?(money|refund)|assured refund)\b/i;

/** Every number in a draft must come from the victim's text or computed facts. */
export function factCheck(draft: string, allowed: string): string[] {
  const numbers = (text: string) => (text.match(/\d[\d,]*/g) ?? []).map((n) => n.replace(/,/g, ""));
  const known = new Set(numbers(allowed));
  const problems = [...new Set(numbers(draft))].filter((n) => !known.has(n)).map((n) => `Number not in your details: ${n}`);
  if (PROMISES.test(draft)) problems.push("Promises a result");
  return problems;
}

export function priorityOf(urgency: Urgency, fields: Pick<Fields, "category" | "amount">): TriageResult["priority"] {
  if (urgency !== "normal" || fields.amount || fields.category === "Extortion & Blackmail" || fields.category === "Women/Children Related Crime") return "HIGH";
  return fields.category === "Not Cybercrime" ? "LOW" : "MEDIUM";
}

export function checklistFor(fields: Pick<Fields, "category" | "utr" | "bank_name" | "amount" | "scammer_upi" | "scammer_contact">): [string, unknown][] {
  const money = fields.category === "Financial Fraud" || fields.category === "E-Commerce Scam";
  return money
    ? [["Transaction UTR", fields.utr], ["Your bank", fields.bank_name], ["Amount lost", fields.amount], ["Scammer ID or number", fields.scammer_upi ?? fields.scammer_contact]]
    : [["Scammer ID or number", fields.scammer_upi ?? fields.scammer_contact]];
}

export function missingFields(fields: Fields): string[] {
  return checklistFor(fields).filter(([, value]) => !value).map(([name]) => name);
}

/** An amount the victim never wrote in digits is dropped, and the tracker asks for it instead. */
function supportedAmount(amount: number | null, story: string): number | null {
  if (amount === null) return null;
  const written = (story.match(/\d[\d,]*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
  return written.includes(amount) ? amount : null;
}

/** Keeps the list only if every payment was written in digits by the victim; a partial list would give a wrong total. */
function supportedTransactions(payments: Transaction[], story: string): Transaction[] {
  return payments.every((payment) => supportedAmount(payment.amount, story) !== null) ? payments : [];
}

export async function runTriage(raw: string, language: string, tools: Tools, emit: (step: Step) => void): Promise<TriageResult> {
  const { text, identifiers } = sanitize(raw);
  const urgency = urgencyOf(raw);
  emit({ tool: "safety_guard", status: "ok", detail: `Sensitive numbers masked. Urgency: ${urgency}` });

  const base: Fields = { ...identifiers, category: "Other Cyber Crime", amount: null, bank_name: null, bank_branch: null, summary: "" };
  if (urgency === "crisis") {
    emit({ tool: "crisis_path", status: "ok", detail: "Stopped report steps to show support contacts first" });
    return { urgency, story: text, fields: base, laws: [], draft: null, draftTranslated: null, draftError: null, priority: "HIGH", missing: [], question: "" };
  }

  const extracted = await tools.ask(
    `Extract from this cybercrime story. Return {"category": one of ${JSON.stringify(CATEGORIES)}, "amount": rupees lost as a number or null, ` +
      `"bank_name": the victim's bank or null, "complainant_name": the victim's own name if stated or null, "scammer_name": the name or role the scammer used if stated or null, "transactions": a list with one {"amount","from_bank","to"} for each separate payment stated, or [], "summary_en": two factual English sentences, "search_terms": English criminal-offence keywords for finding applicable law, such as cheating, personation, identity theft, extortion, criminal intimidation, obscene material,` +
      `"question": the single most useful question to ask next, in language ${language}}. Use null when not stated. Do not guess.\n${wrapStory(text)}`,
    Extraction,
  );
  const transactions = supportedTransactions(extracted.transactions ?? [], text);
  // Plain code adds up the total, and only when every payment appears in the victim's own words
  const amount = transactions.length > 1 ? transactions.reduce((total, payment) => total + payment.amount, 0) : supportedAmount(extracted.amount, text);
  const fields: Fields = { ...base, category: extracted.category, amount, bank_name: extracted.bank_name, summary: extracted.summary_en, transactions, complainant_name: extracted.complainant_name ?? null, scammer_name: extracted.scammer_name ?? null };
  emit({ tool: "extract_fields", status: "ok", detail: `Category: ${fields.category}` });

  if (fields.ifsc) {
    const branch = await tools.lookupIfsc(fields.ifsc);
    if (branch) {
      fields.bank_name ??= branch.bank;
      fields.bank_branch = branch.branch;
    }
    emit({ tool: "lookup_ifsc", status: branch ? "ok" : "failed", detail: branch ? `${branch.bank}, ${branch.branch}` : "IFSC not found or service unreachable" });
  }

  const missing = missingFields(fields);
  const priority = priorityOf(urgency, fields);
  if (fields.category === "Not Cybercrime") {
    emit({ tool: "scope_check", status: "skipped", detail: "This does not look like cybercrime, so no complaint was drafted" });
    return { urgency, story: text, fields, laws: [], draft: null, draftTranslated: null, draftError: null, priority, missing, question: extracted.question };
  }

  const candidates = await tools.searchLaws(extracted.search_terms);
  const laws: TriageResult["laws"] = [];
  if (candidates.length) {
    const chosen = await tools.ask(
      `Choose up to 4 sections that define an offence matching these facts, and give a one-line reason for each. Skip procedural sections and any section that does not clearly fit; choose none if none fit. Return {"picks":[{"id","reason"}]}. Use only these sections:\n` +
        `${candidates.map((c) => `${c.id}: ${c.text.slice(0, 700)}`).join("\n\n")}\n${wrapStory(fields.summary)}`,
      LawPicks,
    );
    // Only sections that retrieval returned can be shown, so a made-up citation is dropped here
    for (const pick of chosen.picks) {
      const found = candidates.find((c) => c.id === pick.id);
      if (found) laws.push({ ...found, reason: pick.reason });
    }
  }
  emit({ tool: "search_law", status: laws.length ? "ok" : "failed", detail: laws.length ? laws.map((l) => `${l.act} s.${l.section}`).join(", ") : "No matching section found" });

  const allowed = `${text} ${JSON.stringify(fields)} ${laws.map((l) => `${l.section} ${l.act}`).join(" ")}`;
  let draft: string | null = null;
  let draftTranslated: string | null = null;
  let draftError: string | null = null;
  const generated = await tools.ask(
    `Write a complete, factual first-person cybercrime complaint for the victim to review, about 120 to 220 words. Tell events in the order they happened: who contacted the victim and what they claimed, each payment with its bank and receiver, names, numbers and IDs given, and the total lost. If you mention law sections, say they may apply, never that an offence is proven. End by requesting investigation and action on the funds. Promise nothing. Return {"complaint_en": text, "complaint_translated": the same complaint in language ${language}}. ` +
      `Use only these facts. Write ____ for anything missing. Add no other number or date.\nFacts: ${JSON.stringify(fields)}\nSections: ${laws.map((l) => `${l.act} s.${l.section}`).join(", ")}\n${wrapStory(text)}`,
    Draft,
  );
  const problems = factCheck(`${generated.complaint_en}\n${generated.complaint_translated}`, allowed);
  if (problems.length) draftError = problems.join("; ");
  else {
    draft = generated.complaint_en;
    draftTranslated = generated.complaint_translated;
  }
  emit({ tool: "fact_check", status: draft ? "ok" : "failed", detail: draftError ?? "Every number traces back to your details" });

  return { urgency, story: text, fields, laws, draft, draftTranslated, draftError, priority, missing, question: extracted.question };
}

/** What the victim may change by hand. Empty text clears a field; anything malformed is rejected. */
const optional = (pattern: RegExp) => z.string().trim().regex(pattern).or(z.literal("").transform(() => null)).nullable().optional();
export const ReportEdit = z.strictObject({
  amount: z.number().nonnegative().max(1e11).nullable().optional(),
  bank_name: z.string().trim().max(100).nullable().optional(),
  utr: optional(/^\d{12}$/),
  ifsc: optional(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/),
  scammer_upi: z.string().trim().max(100).nullable().optional(),
  scammer_contact: z.string().trim().max(100).nullable().optional(),
  draft: z.string().max(10000).optional(),
  category: z.enum(CATEGORIES).optional(),
  complainant_name: z.string().trim().max(100).nullable().optional(),
  scammer_name: z.string().trim().max(120).nullable().optional(),
});

/** Merges a later message into a report. Only values actually found replace existing ones. */
export async function runFollowup(raw: string, fields: Fields, ask: AskLlm): Promise<{ fields: Fields; missing: string[]; story: string }> {
  const { text, identifiers } = sanitize(raw);
  const known = Object.fromEntries(Object.entries(identifiers).filter(([, value]) => value));
  const update = await ask(
    `From this update return {"amount": rupees or null, "bank_name": the victim's bank or null}. Do not guess.\n${wrapStory(text)}`,
    z.object({ amount: z.number().nonnegative().nullable(), bank_name: z.string().max(100).nullable() }),
  );
  const merged: Fields = { ...fields, ...known, amount: supportedAmount(update.amount, text) ?? fields.amount, bank_name: update.bank_name ?? fields.bank_name };
  return { fields: merged, missing: missingFields(merged), story: text };
}
