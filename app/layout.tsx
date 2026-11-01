import type { Metadata } from "next";
import Link from "next/link";
import { FOOTER } from "@/lib/site";
import { SiteHeader } from "./SiteHeader";
import { Icon } from "./Icons";
import "./globals.css";
export const metadata: Metadata = {
  title: "Saakshya | Cybercrime report assistance",
  description: "Prepare a cybercrime report by voice or text and see what to do next. Independent project, not a government service.",
};
function SiteLink({ href, children }: { href: string; children: string }) {
  if (href.startsWith("/")) return <Link href={href}>{children}</Link>;
  return <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>;
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#content">Skip to content</a>
    <SiteHeader />
    <main id="content" tabIndex={-1}>{children}</main>
    <footer className="site-footer no-print"><div className="footer-columns">
      <div className="footer-brand"><p className="brand"><span className="brand-mark"><Icon name="shield"/></span>Saakshya</p><p>Help preparing a cybercrime report, in your language.</p><p>© 2026 Saakshya<br/><small>An independent citizen initiative.</small></p></div>
      {FOOTER.map(([heading, links]) => <div key={heading}><h2>{heading}</h2><ul>{links.map(([name, href]) => <li key={name}><SiteLink href={href}>{name}</SiteLink></li>)}</ul></div>)}
    </div><p className="footer-legal"><strong>Independent platform disclaimer.</strong> Saakshya is not an official government website. It is not affiliated with or endorsed by the Government of India, any state government, the police, RBI or any bank. It does not file reports for you, contact banks or police, or promise money back. It is not legal advice. For official reporting, use <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a> or call <a href="tel:1930">1930</a>.</p></footer>
  </body></html>;
}
