const SECRET_WORD = "(otp|cvv|upi\\s*pin|atm\\s*pin|mpin|pin|password|passcode)";
const SECRET = new RegExp(
  `\\b${SECRET_WORD}\\b\\W{0,5}(is\\W{0,3})?\\w*\\d|\\b\\d{3,8}\\b\\W{0,3}(is\\W{0,3})?(my\\W{0,3})?${SECRET_WORD}\\b`,
  "i",
);
// \b is unreliable with Indian-script vowel signs, so these match on the word itself
const INDIC_WORD = "ओटीपी|पिन|पासवर्ड|ఓటీపీ|పిన్|పాస్\\u200c?వర్డ్|ওটিপি|ஓடிபி|ಒಟಿಪಿ|ഒടിപി|ઓટીપી|ਓਟੀਪੀ|ଓଟିପି|او ٹی پی";
const SECRET_INDIC = new RegExp(`(${INDIC_WORD})\\D{0,15}\\d{3,8}|\\d{3,8}\\D{0,15}(${INDIC_WORD})`);
const ONGOING = /digital arrest|डिजिटल अरेस्ट|డిజిటల్ అరెస్ట్|still on (the )?(call|video)|(on|in) (a |the )?(video )?call (with|from)|told (me )?(to|not to) (pay|transfer|disconnect|tell)|keep(ing)? me on/i;
const CRISIS = /kill myself|आत्महत्या|ఆత్మహత్య|আত্মহত্যা|தற்கொலை|ಆತ್ಮಹತ್ಯೆ|ആത്മഹത്യ|આત્મહત્યા|ਖੁਦਕੁਸ਼ੀ|ଆତ୍ମହତ୍ୟା|خودکشی|khudkushi|aatmahatya|suicid|end my life|don'?t want to live|self[- ]harm/i;
const RECENT = /just now|minutes? ago|abhi|अभी|ఇప్పుడే/i;

const UTR = /\b(?:utr|rrn|ref(?:erence)?(?:\s*(?:no|number|id))?|transaction\s*id)\b\W{0,5}(?:is\W{0,3})?(\d{12})\b/i;
const IFSC = /\b([A-Z]{4}0[A-Z0-9]{6})\b/i;
const UPI = /\b([\w.-]+@[a-z][a-z0-9]+)\b(?!\.[a-z])/i;
const PHONE = /(?<!\d)(?:\+?91[ -]?)?([6-9]\d{9})(?!\d)/;
const MASKS: [RegExp, string][] = [
  [/\b[A-Z]{5}\d{4}[A-Z]\b/gi, "[PAN]"],
  [/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,7}\b/g, "[CARD]"],
  [/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[AADHAAR]"],
  [/\b\d{9,18}\b/g, "[ACCOUNT]"],
];

const DIGIT_ZEROS = [0x660, 0x6f0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66, 0x1c50];

/** Rewrites digits from Indian scripts as 0-9, because every number check below only reads those. */
export function asciiDigits(text: string): string {
  return text.replace(/\p{Nd}/gu, (digit) => {
    const code = digit.codePointAt(0)!;
    const zero = DIGIT_ZEROS.find((start) => code >= start && code < start + 10);
    return zero === undefined ? digit : String(code - zero);
  });
}

export class SecretBlocked extends Error {
  constructor() {
    super("Never share OTPs, PINs or passwords with anyone, including this app. Your text was not saved.");
  }
}

export type Identifiers = { utr: string | null; ifsc: string | null; scammer_upi: string | null; scammer_contact: string | null };

/**
 * Pulls report identifiers out with plain code, then masks what is left, so the LLM never sees
 * them. A bare OTP with no label still gets through; the app warns about this at intake.
 */
export function sanitize(raw: string): { text: string; identifiers: Identifiers } {
  let text = asciiDigits(raw);
  if (SECRET.test(text) || SECRET_INDIC.test(text)) throw new SecretBlocked();
  const take = (pattern: RegExp, label: string) => {
    const match = text.match(pattern);
    if (!match) return null;
    text = text.replace(match[0], label);
    return match[1];
  };
  const identifiers: Identifiers = {
    utr: take(UTR, "UTR [UTR]"),
    ifsc: take(IFSC, "[IFSC]")?.toUpperCase() ?? null,
    scammer_upi: take(UPI, "[UPI_ID]"),
    scammer_contact: take(PHONE, "[PHONE]"),
  };
  for (const [pattern, label] of MASKS) text = text.replace(pattern, label);
  return { text, identifiers };
}

export type Urgency = "crisis" | "ongoing" | "recent" | "normal";

/** Most urgent first. Pasted text is only matched here, never followed as instructions. */
export function urgencyOf(text: string): Urgency {
  if (CRISIS.test(text)) return "crisis";
  if (ONGOING.test(text)) return "ongoing";
  if (RECENT.test(text)) return "recent";
  return "normal";
}
