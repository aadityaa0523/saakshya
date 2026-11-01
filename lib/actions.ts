import { checklistFor, type Fields } from "./agent";

const MONEY = new Set(["Financial Fraud", "E-Commerce Scam"]);
const orBlank = (value: string | number | null | undefined) => value ?? "____";
const rupees = (amount: number | null) => (amount ? `₹${amount.toLocaleString("en-IN")}` : "____");

export function completeness(fields: Fields) {
  const items = checklistFor(fields).map(([name, value]) => ({ name, done: Boolean(value) }));
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}

/** Built only from the victim's own details, so it still works when the AI is down. */
export function callScript(fields: Fields): string[] {
  const scammer = fields.scammer_upi ?? fields.scammer_contact;
  if (!MONEY.has(fields.category)) {
    return [
      `I want to report a cybercrime: ${fields.category}.`,
      `The account or number involved is ${orBlank(scammer)}.`,
      "Please tell me my complaint or acknowledgement number.",
    ];
  }
  return [
    "I want to report online financial fraud.",
    `I lost ${rupees(fields.amount)}. The transaction UTR is ${orBlank(fields.utr)}.`,
    `My bank is ${orBlank(fields.bank_name)}. The money went to ${orBlank(scammer)}.`,
    "Please help put a hold on this money and give me my acknowledgement number.",
  ];
}

export function bankRequest(fields: Fields): string | null {
  if (!MONEY.has(fields.category)) return null;
  const branch = fields.bank_branch ? `, ${fields.bank_branch} branch` : "";
  return [
    `To the Manager / Nodal Officer, ${orBlank(fields.bank_name)}${branch}`,
    "",
    "Subject: Urgent report of an unauthorised or fraudulent transaction",
    "",
    "I am reporting a fraudulent transaction on my account and ask you to act on it urgently.",
    "",
    `Amount: ${rupees(fields.amount)}`,
    `UTR / transaction ID: ${orBlank(fields.utr)}`,
    `Sent to: ${orBlank(fields.scammer_upi ?? fields.scammer_contact)}`,
    "1930 / cybercrime acknowledgement number: ____",
    "",
    "Please (1) contact the receiving bank to request a hold on these funds, (2) block further debits as needed, and (3) confirm the action taken and your complaint reference in writing.",
    "",
    `Name: ${orBlank(fields.complainant_name)}`,
    "Account number: ____",
    "Registered mobile: ____",
  ].join("\n");
}

const CONTACTS: Record<string, [string, string, string][]> = {
  "Financial Fraud": [["RBI complaint portal", "If your bank does not resolve it", "https://cms.rbi.org.in"], ["Sachet (RBI)", "Report illegal deposit or investment schemes", "https://sachet.rbi.org.in"], ["SEBI SCORES", "Complaints about market or investment firms", "https://scores.sebi.gov.in"]],
  "E-Commerce Scam": [["Consumer helpline", "Shopping and delivery problems", "https://consumerhelpline.gov.in"], ["RBI complaint portal", "If your bank does not resolve it", "https://cms.rbi.org.in"]],
  "Identity Theft": [["UIDAI", "If your Aadhaar is involved", "https://uidai.gov.in"], ["Income Tax e-filing", "If your PAN is involved", "https://www.incometax.gov.in"], ["Sanchar Saathi", "Check and report SIMs in your name", "https://sancharsaathi.gov.in"]],
  "Extortion & Blackmail": [["Sanchar Saathi", "Report fraud calls and messages", "https://sancharsaathi.gov.in"], ["Tele-MANAS", "Free mental health support: 14416", "tel:14416"]],
  "Women/Children Related Crime": [["Women helpline", "Call 181", "tel:181"], ["Childline", "Call 1098", "tel:1098"]],
};

const PORTAL: [string, string, string] = ["National cybercrime portal", "File your official complaint", "https://cybercrime.gov.in"];

export const contactsFor = (category: string) => [PORTAL, ...(CONTACTS[category] ?? [])];
