export const metadata = { title: "FAQs - Saakshya" };

const FAQS: [string, string, string?][] = [
  ["I just lost money. What do I do first?", "Call 1930 straight away, then tell your bank. You can prepare your report afterwards."],
  ["Someone says I am under digital arrest. Is that real?", "Hang up and do not pay. Tell someone you trust, then report it on 1930 or at cybercrime.gov.in.", "ongoing"],
  ["Does Saakshya file my complaint?", "No. It prepares a draft for you to check. You file it yourself at cybercrime.gov.in or with the police."],
  ["Will I get my money back?", "Nobody can promise that, and Saakshya does not. Be wary of anyone who does, especially if they ask for a fee or an OTP."],
  ["Why does it refuse my OTP?", "No genuine helper needs your OTP, PIN or password. Saakshya blocks them so they are never saved or sent on."],
  ["Is the legal information advice?", "No. Sections are suggestions to discuss with police or a lawyer."],
  ["Who can see my report?", "Anyone with its private link. Keep that link safe, and delete the report when you no longer need it."],
];

export default function Faqs() {
  return (
    <article className="narrow prose">
      <h1>Frequently asked questions</h1>
      {FAQS.map(([question, answer, id]) => (
        <details key={question} id={id} open={Boolean(id)}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </article>
  );
}
