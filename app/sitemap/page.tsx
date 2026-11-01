import Link from "next/link";
import { FOOTER } from "@/lib/site";

export const metadata = { title: "Sitemap - Saakshya" };

export default function Sitemap() {
  return (
    <article className="narrow prose">
      <h1>Sitemap</h1>
      {FOOTER.map(([heading, links]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <ul>{links.map(([name, href]) => <li key={name}>{href.startsWith("/") ? <Link href={href}>{name}</Link> : <a href={href}>{name}</a>}</li>)}</ul>
        </section>
      ))}
    </article>
  );
}
