import Link from "next/link";

const STEPS = [
  ["Tell it your way", "Speak or type in your language. Never share an OTP or PIN here. Saakshya refuses them."],
  ["Check what it found", "Watch each step as it runs, then correct any detail. Every law it suggests shows the official wording."],
  ["Take the next step yourself", "Use your draft with 1930, your bank and the police, and keep a dated record of what you did."],
];

const CASES = [
  ["Money fraud", "UPI, bank, OTP or card"],
  ["Threats or blackmail", "Loan apps, sextortion"],
  ["Identity misuse", "PAN, Aadhaar, fake profiles"],
  ["Shopping scams", "Fake shops and delivery"],
  ["Harassment", "Stalking and online abuse"],
  ["Something else", "Hacking or stolen data"],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Something went wrong online. Start here.</h1>
        <p className="lead">Tell us what happened. Saakshya turns it into a clear complaint draft, finds the details still missing, and shows who to contact first.</p>
        <div className="actions">
          <Link href="/new" className="button">Start a report</Link>
          <a href="tel:1930" className="button urgent">Call 1930</a>
        </div>
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
      </section>

      <section>
        <h2>What you can report</h2>
        <div className="case-grid">
          {CASES.map(([title, text]) => <Link key={title} href="/new" className="case"><strong>{title}</strong><span>{text}</span></Link>)}
        </div>
      </section>

      <section className="note">
        <h2>What Saakshya will not do</h2>
        <ul>
          <li>Ask for your OTP, PIN or password. Fake recovery agents do. Anyone who asks is not helping you.</li>
          <li>Promise your money back.</li>
          <li>File anything for you. You stay in control of every report.</li>
        </ul>
      </section>
    </>
  );
}
