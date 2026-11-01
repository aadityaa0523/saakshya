export type ScamType = { title: string; detail: string; group: string; tip: string };

export const COMPLAINT_GROUPS: [string, string][] = [
  ["Money fraud", "UPI, bank, card and investment scams"],
  ["Threats and blackmail", "Digital arrest, loan apps and sextortion"],
  ["Identity misuse", "Fake profiles, PAN or Aadhaar misuse, SIM fraud"],
  ["Shopping and jobs", "Fake shops, delivery, job and task scams"],
  ["Harassment and abuse", "Stalking, bullying and online abuse"],
  ["Hacking and data", "Hacked accounts, ransomware and stolen data"],
];

const MONEY_TIP = "The amount, date and time, your bank, the UTR, and the receiver's UPI ID or account.";
const CONTACT_TIP = "The number, profile or website involved, what they said, and when it started.";

export const SCAM_TYPES: ScamType[] = [
  { title: "UPI or bank transfer fraud", detail: "Money sent through a trick or fake request", group: "Money fraud", tip: MONEY_TIP },
  { title: "OTP, KYC or customer care scam", detail: "Fake bank staff, KYC links or helplines", group: "Money fraud", tip: `${MONEY_TIP} Say that you shared a code, but never type the code.` },
  { title: "Credit or debit card fraud", detail: "Payments you did not make", group: "Money fraud", tip: "The amount, date and merchant name, and your bank. Never type your full card number or CVV." },
  { title: "Investment or trading scam", detail: "Fake apps, Telegram tips, guaranteed returns", group: "Money fraud", tip: `${MONEY_TIP} Also the app or group name.` },
  { title: "Digital arrest", detail: "Fake police or officials on a video call", group: "Threats and blackmail", tip: "If you are still on the call, hang up first. Then give the number, the name they used and any payments." },
  { title: "Loan app harassment", detail: "Threats, contact misuse, morphed photos", group: "Threats and blackmail", tip: "The app name, the numbers contacting you, and any payments you made." },
  { title: "Sextortion or blackmail", detail: "Threats to share private photos or videos", group: "Threats and blackmail", tip: "The profile or number and what they demanded. Do not upload the images here, and do not pay." },
  { title: "Fake profile or impersonation", detail: "Someone pretending to be you or a person you know", group: "Identity misuse", tip: "The profile link, the platform, and who is being impersonated." },
  { title: "PAN, Aadhaar or SIM misuse", detail: "Loans, accounts or SIMs in your name", group: "Identity misuse", tip: "What was opened in your name and when you found out. Do not type your full ID number." },
  { title: "Fake shopping or delivery scam", detail: "Fake sites, marketplace or courier scams", group: "Shopping and jobs", tip: `The website or seller, what you ordered, and ${MONEY_TIP.toLowerCase()}` },
  { title: "Job or task scam", detail: "Fake offers, registration fees, paid tasks", group: "Shopping and jobs", tip: `The company name, the recruiter's number, and ${MONEY_TIP.toLowerCase()}` },
  { title: "Online harassment or stalking", detail: "Repeated abuse, threats or tracking", group: "Harassment and abuse", tip: CONTACT_TIP },
  { title: "Hacked account", detail: "Email, WhatsApp or social media taken over", group: "Hacking and data", tip: "Which account, when you lost access, and anything sent from it." },
  { title: "Ransomware or data theft", detail: "Locked files or stolen data", group: "Hacking and data", tip: "What was affected, any message or demand you received, and when it happened." },
];

export const WHATSAPP_NUMBER = "14155238886";
