# Forge '26 submission pack

Update the marked items once the live test is finished. Do not claim anything that has not been run.

## 1. Problem statement

**Target issue:** A person who has just lost money or is being threatened online must act fast, but often does not know who to contact, which details matter or how to describe what happened. Forms can be hard to complete in a second language or under stress, and fake recovery agents target people at this moment.

**Target audience:** Cybercrime victims in India, especially people more comfortable in a regional language, older people, and the relatives who help them.

## 2. Solution

**Overview:** Saakshya turns a story told by voice or text into a checked complaint draft and clear next steps. It runs safety checks first, extracts the details, looks up the bank from an IFSC, retrieves law sections from official Act text, drafts the complaint, then checks every number against what the victim said. Each step appears on screen. The victim reviews everything and files it themselves.

**Why it is different:**
- Invented numbers hold a draft back, and only retrieved law sections can be cited.
- OTPs and PINs are refused, and ID numbers are masked before the AI sees the text.
- A dated, hash-chained record shows if anything was changed, including evidence files.
- It states its limits: it files nothing, promises no recovery and is not a government service.

**Architecture:** Next.js on Vercel, Postgres on Supabase with full-text search over the BNS 2023 and IT Act 2000, Gemini through an OpenAI-compatible API, and the Razorpay IFSC API. Voice uses the same AI service. WhatsApp runs on the Twilio sandbox, so demo it from a phone that has joined.

## 3. Links

- Live app: https://saakshya-eta.vercel.app
- Repository: https://github.com/aadityaa0523/saakshya
- Video: [ADD]
- Deck: [ADD]

## 4. Video script (2-3 minutes, recorded on the live app)

Say that the story is made up.

1. **0:00 Hook.** "When money disappears, you have minutes and no idea what to do."
2. **0:15 Home page.** Show the 1930 card and the "not a government website" notice.
3. **0:30 Report.** Enter a made-up Hindi story and show the agent steps running.
4. **1:00 Review.** Show the details found, what is still missing, the cited law text and the draft.
5. **1:30 Update.** Add "UTR is ..." and show the tracker change.
6. **1:45 Evidence and record.** Add a file and show its fingerprint in the dated record.
7. **2:05 Guardrail.** Type a story containing "my OTP is 482910" and show the refusal.
8. **2:20 Crisis path.** Show support contacts replacing the report steps.
9. **2:35 Close.** "You stay in control. Saakshya prepares it, and you file it."

## 5. Deck outline (5-7 slides)

1. **Title and team:** [ADD team names]
2. **The problem:** the first hour after fraud. Use only figures with an official source.
3. **The solution:** tell it, check it, take it to the right place.
4. **Architecture and innovation:** the pipeline above, plus the fact check and hash chain.
5. **Guardrails:** OTP refusal, masking, honest failures, no filing.
6. **Evidence it works:** 12 live hard cases, all passing after fixes, with one note and the limits stated. See `docs/TEST_RESULTS.md`.
7. **Roadmap:** legal review, security audit, India-region hosting, more languages, partner pilots.

## 6. Be ready to explain

- What happens when the AI or database is down.
- Why the AI writes, while plain code sets priority and checks numbers.
- How the hash chain and fingerprints work.
- That Samarthan inspired the feature set, and no code or design was copied from it.
