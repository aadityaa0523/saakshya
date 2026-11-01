export const REPO = "https://github.com/aadityaa0523/saakshya";

export const MENUS: [string, [string, string][]][] = [
  ["Get help", [["Start a report", "/new"], ["My reports", "/reports"], ["Scam still happening?", "/faqs#ongoing"]]],
  ["Learn", [["How it works", "/#how"], ["FAQs", "/faqs"], ["About Saakshya", "/about"]]],
  ["Official services", [["National cybercrime portal", "https://cybercrime.gov.in"], ["RBI complaint portal", "https://cms.rbi.org.in"], ["Sanchar Saathi", "https://sancharsaathi.gov.in"]]],
];

// Text links only: Saakshya is not part of these services and must not look as if it is
export const OFFICIAL: [string, string, string][] = [
  ["Cybercrime portal", "File an official complaint", "https://cybercrime.gov.in"],
  ["RBI complaints", "If your bank does not resolve it", "https://cms.rbi.org.in"],
  ["Sanchar Saathi", "Report fraud calls and SIMs", "https://sancharsaathi.gov.in"],
  ["Consumer helpline", "Shopping and delivery problems", "https://consumerhelpline.gov.in"],
];

export const FOOTER: [string, [string, string][]][] = [
  ["Get help", [["Start a report", "/new"], ["My reports", "/reports"], ["Call 1930", "tel:1930"], ["Police: 112", "tel:112"], ["Tele-MANAS: 14416", "tel:14416"]]],
  ["Official services", OFFICIAL.map(([name, , url]) => [name, url])],
  ["Resources", [["How it works", "/#how"], ["FAQs", "/faqs"], ["About Saakshya", "/about"], ["Source code", REPO]]],
  ["Legal", [["Terms and conditions", "/terms"], ["Privacy policy", "/privacy"], ["Accessibility statement", "/accessibility"], ["Contact us", "/contact"], ["Sitemap", "/sitemap"]]],
];
