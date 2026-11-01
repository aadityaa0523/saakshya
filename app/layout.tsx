import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saakshya",
  description: "Prepare a cybercrime report by voice or text and see what to do next. Independent project, not a government service.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="alert-bar no-print" href="tel:1930">Money sent? Call <strong>1930</strong> now, before anything else.</a>
        <header className="site-header no-print">
          <Link href="/" className="brand">Saakshya</Link>
          <nav>
            <Link href="/reports">My reports</Link>
            <Link href="/new" className="button small">Start a report</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Saakshya is an independent project, not a government service. It does not file reports for you, contact banks or police, or promise money back.
            It is not legal advice. Official reporting: <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a> or call 1930.
          </p>
        </footer>
      </body>
    </html>
  );
}
