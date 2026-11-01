import { REPO } from "@/lib/site";

export const metadata = { title: "Contact us - Saakshya" };

export default function Contact() {
  return (
    <article className="narrow prose">
      <h1>Contact us</h1>
      <p className="panel urgent-panel"><strong>We cannot act on your case.</strong> For cyber fraud, call <a href="tel:1930">1930</a> or use <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a>. In immediate danger, call <a href="tel:112">112</a>.</p>
      <p>For problems with this website, <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">open an issue on GitHub</a>. Issues are public, so never include your story, bank details or any personal information.</p>
    </article>
  );
}
