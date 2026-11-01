import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { bankRequest, callScript, completeness, contactsFor } from "@/lib/actions";
import { factCheck, missingFields, priorityOf, ReportEdit, runFollowup, runTriage, type Fields, type Tools } from "@/lib/agent";
import { chainIsValid, nextEntry } from "@/lib/chain";
import { addEvidence, getEvidence, overLimit, sniffType } from "@/lib/evidence";
import { LlmError } from "@/lib/llm";
import { sanitize, SecretBlocked, urgencyOf } from "@/lib/safety";
import { appendEvent, createReport, getReport, searchLaws, verifyChain, type Query } from "@/lib/store";

const LAW = { id: "it-66d", act: "IT Act 2000", section: "66D", text: "cheating by personation by using computer resource", source_url: "https://www.indiacode.nic.in/" };
const EXTRACT = { category: "Financial Fraud", amount: 50000, bank_name: "SBI", summary_en: "Victim sent money via a UPI link.", search_terms: "cheating personation", question: "What is the UTR?" };

/** Test stand-in for the LLM: answers by prompt type, so the real pipeline code still runs. */
function fakeTools(draftEn = "I lost Rs 50,000 through a UPI link. My UTR is ____."): Tools {
  return {
    ask: (async (prompt: string, schema: { parse: (value: unknown) => unknown }) => {
      if (prompt.startsWith("Extract")) return schema.parse(EXTRACT);
      if (prompt.startsWith("Choose")) return schema.parse({ picks: [{ id: "it-66d", reason: "impersonation" }, { id: "made-up-99", reason: "invented" }] });
      return schema.parse({ complaint_en: draftEn, complaint_translated: "मैंने 50,000 रुपये खो दिए।" });
    }) as Tools["ask"],
    searchLaws: async () => [LAW],
    lookupIfsc: async () => ({ bank: "State Bank of India", branch: "Hyderabad" }),
  };
}

describe("safety guard", () => {
  it.each(["my otp is 482910", "OTP: 4829", "4829 is my pin", "मेरा ओटीपी 482910 है"])("blocks %s", (text) => {
    expect(() => sanitize(text)).toThrow(SecretBlocked);
  });
  it("allows talking about an OTP without a number", () => {
    expect(sanitize("they asked for my otp and I gave it").text).toContain("otp");
  });
  it("masks PAN, card, Aadhaar and account numbers", () => {
    const { text } = sanitize("PAN ABCDE1234F card 4111 1111 1111 1111 aadhaar 2345 6789 0123 acct 12345678901");
    for (const label of ["[PAN]", "[CARD]", "[AADHAAR]", "[ACCOUNT]"]) expect(text).toContain(label);
    expect(text).not.toMatch(/\d{4}/);
  });
  it("keeps identifiers apart from the text the LLM sees", () => {
    const { text, identifiers } = sanitize("UTR is 482910394821, IFSC SBIN0000123, paid scam@ybl, called 9876543210");
    expect(identifiers).toEqual({ utr: "482910394821", ifsc: "SBIN0000123", scammer_upi: "scam@ybl", scammer_contact: "9876543210" });
    expect(text).not.toMatch(/482910394821|SBIN|scam@ybl|9876543210/);
  });
  it("finds a UPI ID at the end of a sentence, but not an email address", () => {
    expect(sanitize("I paid scam@ybl. Then he called.").identifiers.scammer_upi).toBe("scam@ybl");
    expect(sanitize("Write to help@example.com now").identifiers.scammer_upi).toBeNull();
  });
  it("treats an unlabelled 12-digit number as Aadhaar, not a UTR", () => {
    const { text, identifiers } = sanitize("number 482910394821 was used");
    expect(identifiers.utr).toBeNull();
    expect(text).toContain("[AADHAAR]");
  });
  it("blocks a Telugu password with or without the joiner character", () => {
    expect(() => sanitize("పాస్\u200cవర్డ్ 4829")).toThrow(SecretBlocked);
    expect(() => sanitize("పాస్వర్డ్ 4829")).toThrow(SecretBlocked);
  });
  it("orders urgency", () => {
    expect(urgencyOf("digital arrest and I want to kill myself")).toBe("crisis");
    expect(urgencyOf("I am in a digital arrest")).toBe("ongoing");
    expect(urgencyOf("money went 5 minutes ago")).toBe("recent");
    expect(urgencyOf("it happened last year")).toBe("normal");
  });
});

describe("hash chain", () => {
  it("detects a changed event and a removed event", () => {
    const first = nextEntry(undefined, { type: "a" }, "t1");
    const second = nextEntry(first, { type: "b" }, "t2");
    expect(chainIsValid([first, second])).toBe(true);
    expect(chainIsValid([{ ...first, event: { type: "x" } }, second])).toBe(false);
    expect(chainIsValid([second])).toBe(false);
  });
  it("does not depend on key order", () => {
    const entry = nextEntry(undefined, { a: 1, b: 2 }, "t");
    expect(chainIsValid([{ ...entry, event: { b: 2, a: 1 } }])).toBe(true);
  });
});

describe("rules", () => {
  it("fact check rejects invented numbers and promises", () => {
    expect(factCheck("I lost 50,000", "lost ₹50,000")).toEqual([]);
    expect(factCheck("I lost 75,000", "lost ₹50,000")).toHaveLength(1);
    expect(factCheck("You will get your money back", "")).toEqual(["Promises a result"]);
  });
  it("sets priority in plain code", () => {
    expect(priorityOf("normal", { category: "Other Cyber Crime", amount: null })).toBe("MEDIUM");
    expect(priorityOf("normal", { category: "Financial Fraud", amount: 1 })).toBe("HIGH");
    expect(priorityOf("normal", { category: "Not Cybercrime", amount: null })).toBe("LOW");
  });
  it("lists what is missing", () => {
    const fields = { category: "Financial Fraud", amount: 5, bank_name: null, utr: null, scammer_upi: "a@b", scammer_contact: null } as Fields;
    expect(missingFields(fields)).toEqual(["Transaction UTR", "Your bank"]);
  });
});

describe("evidence types", () => {
  it("trusts file contents, not names", () => {
    expect(sniffType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});

describe("victim kit", () => {
  const fields = { category: "Financial Fraud", amount: 12000, bank_name: "SBI", bank_branch: null, utr: null, ifsc: null, scammer_upi: "scam@ybl", scammer_contact: null, summary: "" } as Fields;
  it("scores readiness from real details", () => {
    expect(completeness(fields)).toMatchObject({ done: 3, total: 4, percent: 75 });
  });
  it("leaves blanks rather than inventing details", () => {
    expect(callScript(fields).join(" ")).toContain("₹12,000");
    expect(callScript(fields).join(" ")).toContain("UTR is ____");
    expect(bankRequest(fields)).toContain("UTR / transaction ID: ____");
    expect(bankRequest(fields)).toContain("Sent to: scam@ybl");
  });
  it("has no bank request for non-money reports, and always lists the portal", () => {
    const threat = { ...fields, category: "Extortion & Blackmail" };
    expect(bankRequest(threat)).toBeNull();
    expect(contactsFor(threat.category)[0][2]).toBe("https://cybercrime.gov.in");
    expect(contactsFor("Unknown")).toHaveLength(1);
  });
});

describe("report edits", () => {
  it("accepts valid details and clears empty ones", () => {
    expect(ReportEdit.parse({ utr: "482910394821", ifsc: "" })).toEqual({ utr: "482910394821", ifsc: null });
  });
  it.each([{ utr: "12345" }, { ifsc: "BAD" }, { amount: -1 }, { priority: "LOW" }])("rejects %j", (edit) => {
    expect(ReportEdit.safeParse(edit).success).toBe(false);
  });
});

describe("agent", () => {
  it("runs end to end and drops a citation retrieval never returned", async () => {
    const steps: string[] = [];
    const result = await runTriage("I sent ₹50,000 through a UPI link, IFSC SBIN0000123", "hi", fakeTools(), (s) => steps.push(s.tool));
    expect(steps).toEqual(["safety_guard", "extract_fields", "lookup_ifsc", "search_law", "fact_check"]);
    expect(result.laws.map((l) => l.id)).toEqual(["it-66d"]);
    expect(result.draft).toContain("50,000");
    expect(result.fields.bank_branch).toBe("Hyderabad");
  });
  const withExtract = (extra: object) => {
    const tools = fakeTools("I paid several amounts through UPI to a fraudster and I request action on this.");
    return { ...tools, ask: (async (prompt: string, schema: { parse: (value: unknown) => unknown }) => prompt.startsWith("Extract") ? schema.parse({ ...EXTRACT, ...extra }) : tools.ask(prompt, schema as never)) as Tools["ask"] };
  };
  it("adds up separate payments in plain code", async () => {
    const tools = withExtract({ amount: 999, transactions: [{ amount: 200000, from_bank: "HDFC" }, { amount: 350000, from_bank: "ICICI" }, { amount: 75000 }] });
    const result = await runTriage("I paid ₹2,00,000 from HDFC, ₹3,50,000 from ICICI and ₹75,000 by UPI", "en", tools, () => {});
    expect(result.fields.amount).toBe(625000);
    expect(result.fields.transactions).toHaveLength(3);
  });
  it("refuses a total when any payment was not in the story", async () => {
    const tools = withExtract({ amount: null, transactions: [{ amount: 1000 }, { amount: 7777 }] });
    const result = await runTriage("I paid ₹1,000 and then some more by UPI", "en", tools, () => {});
    expect(result.fields.amount).toBeNull();
    expect(result.fields.transactions).toEqual([]);
  });
  it("accepts search terms sent as a list", async () => {
    const tools = fakeTools();
    let searched = "";
    const ask = tools.ask;
    const listing = { ...tools, searchLaws: async (terms: string) => { searched = terms; return tools.searchLaws(terms); }, ask: (async (prompt: string, schema: { parse: (value: unknown) => unknown }) => prompt.startsWith("Extract") ? schema.parse({ ...EXTRACT, search_terms: ["cheating", "personation"] }) : ask(prompt, schema as never)) as Tools["ask"] };
    await runTriage("I sent ₹50,000 through a UPI link", "en", listing, () => {});
    expect(searched).toBe("cheating personation");
  });
  it("withholds a draft with an invented number", async () => {
    const result = await runTriage("I sent ₹50,000 through a UPI link", "hi", fakeTools("On 12 March I lost Rs 50,000 through a link sent to my phone."), () => {});
    expect(result.draft).toBeNull();
    expect(result.draftError).toContain("12");
  });
  it("drops an amount the victim never wrote", async () => {
    const result = await runTriage("I was cheated through a UPI link", "en", fakeTools("I was cheated through a UPI link and lost some of my money."), () => {});
    expect(result.fields.amount).toBeNull();
    expect(result.missing).toContain("Amount lost");
  });
  it("stops at support contacts on a crisis, with no LLM call", async () => {
    const tools = { ...fakeTools(), ask: (async () => { throw new Error("must not be called"); }) as Tools["ask"] };
    expect((await runTriage("I lost it all and want to kill myself", "en", tools, () => {})).urgency).toBe("crisis");
  });
  it("blocks an OTP before any LLM call", async () => {
    await expect(runTriage("the otp is 482910", "en", fakeTools(), () => {})).rejects.toThrow(SecretBlocked);
  });
  it("surfaces an LLM failure instead of template text", async () => {
    const tools = { ...fakeTools(), ask: (async () => { throw new LlmError("down"); }) as Tools["ask"] };
    await expect(runTriage("I sent money through a UPI link", "en", tools, () => {})).rejects.toThrow(LlmError);
  });
  it("follow-up fills only what it finds", async () => {
    const before = { category: "Financial Fraud", amount: 5000, bank_name: "SBI", utr: null, ifsc: null, scammer_upi: null, scammer_contact: null, bank_branch: null, summary: "" } as Fields;
    const ask = (async (_: string, schema: { parse: (value: unknown) => unknown }) => schema.parse({ amount: null, bank_name: null })) as Tools["ask"];
    const { fields, missing } = await runFollowup("UTR is 482910394821", before, ask);
    expect(fields.utr).toBe("482910394821");
    expect(fields.bank_name).toBe("SBI");
    expect(missing).toEqual(["Scammer ID or number"]);
  });
});

describe("database", () => {
  const db = new PGlite();
  const query = ((sql: string, params?: unknown[]) => db.query(sql, params)) as unknown as Query;
  beforeAll(async () => {
    await db.exec(readFileSync("db/schema.sql", "utf8"));
    await query("INSERT INTO law_sections (id, act, section, text, source_url) VALUES ($1,$2,$3,$4,$5)", Object.values(LAW));
  });

  it("stores a report behind its token and detects tampering", async () => {
    const result = await runTriage("I sent ₹50,000 through a UPI link", "hi", fakeTools(), () => {});
    const { id, token } = await createReport(query, result, "hi");
    expect(await getReport(query, id, "wrong")).toBeNull();
    expect((await getReport(query, id, token)).fields.amount).toBe(50000);
    await appendEvent(query, id, { type: "called_1930", acknowledgement: "ACK1" });
    expect((await verifyChain(query, id)).valid).toBe(true);
    await query("UPDATE report_events SET event = $1 WHERE report_id = $2 AND seq = 1", [JSON.stringify({ type: "forged" }), id]);
    expect((await verifyChain(query, id)).valid).toBe(false);
  });
  it("stores evidence, fingerprints it in the record and detects a changed file", async () => {
    const result = await runTriage("I sent ₹50,000 through a UPI link", "hi", fakeTools(), () => {});
    const { id } = await createReport(query, result, "hi");
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    const saved = await addEvidence(query, id, "../proof<1>.png", png, "image/png");
    expect(saved!.name).toBe(".._proof_1_.png");
    expect((await getEvidence(query, id, saved!.id))!.intact).toBe(true);
    expect((await verifyChain(query, id)).events.at(-1)!.event).toMatchObject({ type: "evidence_added", sha256: saved!.sha256 });
    await query("UPDATE evidence SET data = $1 WHERE id = $2", [new Uint8Array([9]), saved!.id]);
    expect((await getEvidence(query, id, saved!.id))!.intact).toBe(false);
    expect(await getEvidence(query, "00000000-0000-4000-8000-000000000000", saved!.id)).toBeNull();
  });
  it("limits requests per client", async () => {
    expect(await overLimit(query, "1.2.3.4", "test", 1)).toBe(false);
    expect(await overLimit(query, "1.2.3.4", "test", 1)).toBe(true);
    expect(await overLimit(query, "5.6.7.8", "test", 1)).toBe(false);
  });
  it("finds law sections by full-text search", async () => {
    expect((await searchLaws(query, "cheating personation")).map((l) => l.id)).toEqual(["it-66d"]);
    expect(await searchLaws(query, "zebra")).toEqual([]);
  });
});
