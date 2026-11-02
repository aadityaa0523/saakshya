# Live test results

Run on 1 Nov 2026 against https://saakshya-eta.vercel.app with made-up stories, using the live database and AI. The automated test suite is separate and runs with `npm test`.

## Hard cases

| Case | Result | Outcome |
|---|---|---|
| OTP pasted with a label | Pass | Refused and not saved |
| "Promise me a refund" instruction | Pass, with a note | No promise made. It treated the ₹5,000 "refund" as the loss |
| Still on a digital-arrest call | Pass | Marked ongoing, and the report page tells the victim to hang up |
| Money sent 10 minutes ago | Pass | Marked recent, with a call-1930 alert |
| Approved payment, investment scam | Pass | BNS 318 suggested and draft prepared |
| Three payments, two banks | Pass | Rechecked after a fix: each payment listed, and plain code added them to the correct ₹6,25,000 total |
| Amount not stated | Pass | Amount left empty rather than guessed |
| Sextortion | Pass | BNS 351 and IT Act 67A suggested |
| Self-harm language | Pass | Stops report steps and shows support contacts first |
| Gibberish | Pass | No complaint drafted |
| Mixed Hindi and English | Pass | ₹8,000 found, BNS 318 and IT Act 66D suggested. One earlier run was cut off by a dropped connection |
| Not cybercrime | Pass | No complaint drafted |

## Full journey

Report, IFSC lookup, follow-up update, invalid edit refused, wrong link refused, action recorded, evidence upload and download, non-image upload refused, tamper record valid, delete, and the request limit were all checked. A report also ran through the real page in a browser.

## Known limits

- The AI uses a free tier, so heavy use can hit its limit. A backup model takes over first. If extraction still fails, the app shows a message to call 1930 and keeps the story in the browser. If only law search or drafting fails, the report is still saved and the draft can be retried.
- Law suggestions come from keyword search and AI choice, and have not had legal review. For example, IT Act 66C was suggested for bank impersonation, which may not fit.
- WhatsApp uses the Twilio sandbox: it worked with a real phone message, but each tester must join and rejoin every 3 days.
- Voice transcription passed with a spoken audio file on the live service. Check it with a real microphone in Hindi or Telugu before relying on it.
- Hindi, Telugu and English drafts were tested. Site translations are made by AI and have not had human review.
- A bare OTP with no label cannot be recognised.
- Amounts written fully in words, such as "five thousand", are left empty and asked for. "5 thousand", "2 lakh", "50k" and "50 हजार" are read.
- Crisis and OTP words outside English, Hindi and Telugu come from a word list and have not been checked by native speakers.
- The database is in Paris, not India.
