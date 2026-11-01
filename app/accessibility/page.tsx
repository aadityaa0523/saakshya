import { REPO } from "@/lib/site";

export const metadata = { title: "Accessibility statement - Saakshya" };

export default function Accessibility() {
  return (
    <article className="narrow prose">
      <h1>Accessibility statement</h1>
      <p>We want people to be able to use Saakshya by voice, keyboard or screen reader, on a phone or a computer.</p>
      <h2>What we have done</h2>
      <ul>
        <li>Real buttons and form labels, a skip link, and a layout that works at phone width.</li>
        <li>Voice input, and drafts in 15 languages.</li>
      </ul>
      <h2>Known limits</h2>
      <p>Saakshya has not had an independent accessibility audit. The site&apos;s own menus and pages are still in English. If something blocks you, please <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">tell us</a>.</p>
    </article>
  );
}
