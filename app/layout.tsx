import type { Metadata } from "next";
import Link from "next/link";
import { FOOTER, MENUS } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saakshya",
  description: "Prepare a cybercrime report by voice or text and see what to do next. Independent project, not a government service.",
};

function SiteLink({ href, children }: { href: string; children: string }) {
  if (href.startsWith("/")) return <Link href={href}>{children}</Link>;
  return <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">Skip to content</a>
        <p className="identity-strip no-print">Saakshya is an independent project, not a government website. <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Go to the official portal</a></p>
        <a className="alert-bar no-print" href="tel:1930">Money sent? Call <strong>1930</strong> now, before anything else.</a>
        <header className="site-header no-print">
          <div className="header-inner">
            <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">S</span>Saakshya</Link>
            <nav aria-label="Main">
              {MENUS.map(([label, links]) => (
                <div className="menu" key={label}>
                  <button type="button" aria-haspopup="true">{label} <span aria-hidden="true">▾</span></button>
                  <ul>{links.map(([name, href]) => <li key={name}><SiteLink href={href}>{name}</SiteLink></li>)}</ul>
                </div>
              ))}
            </nav>
            <Link href="/new" className="button small">Start a report</Link>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer no-print">
          <div className="footer-columns">
            <div className="footer-brand">
              <p className="brand"><span className="brand-mark" aria-hidden="true">S</span>Saakshya</p>
              <p>Help preparing a cybercrime report, in your language.</p>
              <p>© 2026 Saakshya</p>
            </div>
            {FOOTER.map(([heading, links]) => (
              <div key={heading}>
                <h2>{heading}</h2>
                <ul>{links.map(([name, href]) => <li key={name}><SiteLink href={href}>{name}</SiteLink></li>)}</ul>
              </div>
            ))}
          </div>
          <p className="footer-legal">
            Saakshya is not an official government website. It is an independent project, not affiliated with or endorsed by the Government of India, any state government, the police, RBI or any bank.
            It does not file reports for you, contact banks or police, or promise money back. It is not legal advice. For official reporting, use cybercrime.gov.in or call 1930.
          </p>
        </footer>
      </body>
    </html>
  );
}
