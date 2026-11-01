export type SavedReport = { id: string; token: string; category: string; priority: string; savedAt: string };

const KEY = "saakshya-reports";

// Browser storage can throw or be empty in private windows, so a failure just means an empty list
export function savedReports(): SavedReport[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberReport(report: SavedReport) {
  try {
    localStorage.setItem(KEY, JSON.stringify([report, ...savedReports().filter((r) => r.id !== report.id)]));
  } catch {}
}

export function forgetReport(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(savedReports().filter((r) => r.id !== id)));
  } catch {}
}

// Stays in this browser tab; a story must never travel in a web address
const DRAFT_KEY = "saakshya-draft";

export function saveDraft(text: string) {
  try {
    sessionStorage.setItem(DRAFT_KEY, text);
  } catch {}
}

export function takeDraft(): string {
  try {
    const text = sessionStorage.getItem(DRAFT_KEY) ?? "";
    sessionStorage.removeItem(DRAFT_KEY);
    return text;
  } catch {
    return "";
  }
}

export const LANGUAGES: [string, string][] = [
  ["English", "English"], ["Hindi", "हिन्दी"], ["Bengali", "বাংলা"], ["Marathi", "मराठी"], ["Telugu", "తెలుగు"],
  ["Tamil", "தமிழ்"], ["Gujarati", "ગુજરાતી"], ["Urdu", "اردو"], ["Kannada", "ಕನ್ನಡ"], ["Odia", "ଓଡ଼ିଆ"],
  ["Malayalam", "മലയാളം"], ["Punjabi", "ਪੰਜਾਬੀ"], ["Assamese", "অসমীয়া"], ["Nepali", "नेपाली"], ["Sindhi", "سنڌي"],
];
