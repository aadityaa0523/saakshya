import Image from "next/image";
import Link from "next/link";
import { PostCards } from "./PostCards";
import { photo } from "@/lib/blog";
import { query } from "@/lib/server";
import { OFFICIAL } from "@/lib/site";

export const dynamic = "force-dynamic";

const STEPS = [
  ["Tell it your way", "Speak or type in your language. Never share an OTP or PIN here. Saakshya refuses them."],
  ["Check what it found", "Watch each step as it runs, then correct any detail. Every law it suggests shows the official wording."],
  ["Take the next step yourself", "Use your draft with 1930, your bank and the police, and keep a dated record of what you did."],
];

const CASES = [
  ["Money fraud", "UPI, bank, OTP or card", "1556742521-9713bf272865"],
  ["Threats or blackmail", "Loan apps, sextortion", "1493836512294-502baa1986e2"],
  ["Identity misuse", "PAN, Aadhaar, fake profiles", "1614064641938-3bbee52942c7"],
  ["Shopping scams", "Fake shops and delivery", "1713947506242-8fcae733d158"],
  ["Harassment", "Stalking and online abuse", "1776797391265-01a0490d4c99"],
  ["Something else", "Hacking or stolen data", "1614064548016-0b5c13ca2c85"],
];

/** Real counts only. If the database is unavailable the row is hidden, never filled with placeholders. */
async function liveStats() {
  try {
    const { rows } = await query("SELECT (SELECT count(*)::int FROM reports) AS reports, (SELECT count(*)::int FROM law_sections) AS laws");
    return rows[0] as { reports: number; laws: number };
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await liveStats();
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Cybercrime report help</p>
          <h1>Something went wrong online. Start here.</h1>
          <p className="lead">Tell us what happened. Saakshya turns it into a clear complaint draft, finds the details still missing, and shows who to contact first.</p>
          <div className="actions"><Link href="/new" className="button">Start a report</Link></div>
        </div>
        <div className="hero-visual">
          <Image src={photo("1689848693914-7ba25d9f3334", 1200)} alt="A woman at a computer talking on her phone" width={1200} height={800} unoptimized priority />
          <aside className="hero-card">
            <p className="eyebrow">Is money gone right now?</p>
            <h2>Call before you do anything else</h2>
            <a href="tel:1930" className="hero-number">1930</a>
            <p>National cyber fraud helpline. You can finish your report after the call.</p>
          </aside>
        </div>
      </section>

      {stats && (
        <section className="stats" aria-label="Live counts">
          <div><strong>{stats.reports.toLocaleString("en-IN")}</strong><span>Reports prepared here</span></div>
          <div><strong>{stats.laws.toLocaleString("en-IN")}</strong><span>Law sections searched</span></div>
          <div><strong>15</strong><span>Languages for your draft</span></div>
        </section>
      )}

      <section id="how">
        <p className="eyebrow">How it works</p>
        <h2>From what happened to what to do next</h2>
        <ol className="steps">
          {STEPS.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Choose what happened</p>
        <h2>What you can report</h2>
        <div className="case-grid">
          {CASES.map(([title, text, image]) => (
            <Link key={title} href="/new" className="photo-card">
              <Image src={photo(image, 600)} alt="" width={600} height={340} unoptimized />
              <div><strong>{title}</strong><span>{text}</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="note">
        <p className="eyebrow">Stay safe</p>
        <h2>What Saakshya will not do</h2>
        <ul>
          <li>Ask for your OTP, PIN or password. Fake recovery agents do. Anyone who asks is not helping you.</li>
          <li>Promise your money back.</li>
          <li>File anything for you. You stay in control of every report.</li>
        </ul>
      </section>

      <section>
        <p className="eyebrow">Guides</p>
        <h2>Stay safe and act quickly</h2>
        <PostCards />
      </section>

      <section>
        <p className="eyebrow">Official services</p>
        <h2>Where official reports are made</h2>
        <p className="lead">These are run by others. Saakshya is not part of them.</p>
        <div className="official-grid">
          {OFFICIAL.map(([name, text, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="case"><strong>{name} ↗</strong><span>{text}</span></a>)}
        </div>
      </section>
    </>
  );
}
