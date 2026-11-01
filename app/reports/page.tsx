"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Fields } from "@/lib/agent";
import { savedReports, type SavedReport } from "@/lib/client";

type Case = SavedReport & { fields?: Fields; priority: string; urgency?: string; steps: { type: string; at: string }[]; files: number; unavailable?: boolean };

const STEPS: [string, string][] = [["called_1930", "Called 1930"], ["told_bank", "Told bank"], ["filed_portal", "Filed on portal"], ["filed_police", "Went to police"]];

async function loadCase(saved: SavedReport): Promise<Case> {
  const headers = { "x-report-token": saved.token };
  try {
    const [report, chain, evidence] = await Promise.all(["", "/verify", "/evidence"].map((path) => fetch(`/api/reports/${saved.id}${path}`, { headers }).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })));
    return { ...saved, fields: report.fields, priority: report.priority, urgency: report.urgency, files: evidence.files.length, steps: chain.events.map((entry: { at: string; event: { type: string } }) => ({ type: entry.event.type, at: entry.at })) };
  } catch {
    return { ...saved, steps: [], files: 0, unavailable: true };
  }
}

export default function Reports() {
  const [cases, setCases] = useState<Case[] | null>(null);
  useEffect(() => {
    Promise.all(savedReports().map(loadCase)).then(setCases);
  }, []);

  const live = cases?.filter((item) => !item.unavailable) ?? [];
  const total = live.reduce((sum, item) => sum + (item.fields?.amount ?? 0), 0);
  const called = live.filter((item) => item.steps.some((step) => step.type === "called_1930")).length;
  const files = live.reduce((sum, item) => sum + item.files, 0);

  return (
    <section className="dashboard">
      <div className="report-head">
        <div>
          <h1>My reports</h1>
          <p className="lead">Reports started on this device, and the steps you have recorded. Saakshya only shows what you marked. It cannot see what banks or police have done.</p>
        </div>
        <Link href="/new" className="button">New report</Link>
      </div>

      {cases === null && <p role="status">Loading your reports...</p>}
      {cases?.length === 0 && <p className="panel">No reports on this device yet. <Link href="/new">Start a report</Link></p>}

      {live.length > 0 && (
        <div className="case-facts">
          <div><small>Reports</small><strong>{live.length}</strong></div>
          <div><small>Total reported lost</small><strong>₹{total.toLocaleString("en-IN")}</strong></div>
          <div><small>Reported to 1930</small><strong>{called} of {live.length}</strong></div>
          <div><small>Evidence files</small><strong>{files}</strong></div>
        </div>
      )}

      {cases?.map((item) => item.unavailable ? (
        <p className="panel" key={item.id}>A report from {new Date(item.savedAt).toLocaleDateString("en-IN")} could not be opened. It may have been deleted, or the connection failed.</p>
      ) : (
        <article className="case-card" key={item.id}>
          <header>
            <div>
              <p className="case-tags"><code>{`SK-${item.id.slice(0, 8).toUpperCase()}`}</code><span className={item.priority === "HIGH" ? "tag urgent-tag" : "tag"}>{item.priority} priority</span></p>
              <h2>{item.fields?.category}</h2>
            </div>
            {item.fields?.amount ? <strong className="case-amount">₹{item.fields.amount.toLocaleString("en-IN")} reported lost</strong> : null}
          </header>
          <p>{item.fields?.summary}</p>
          <ol className="case-steps">
            {STEPS.map(([type, label]) => {
              const step = item.steps.find((candidate) => candidate.type === type);
              return <li key={type} className={step ? "is-done" : ""}><strong>{step ? "✓" : "○"} {label}</strong><small>{step ? new Date(step.at).toLocaleString("en-IN") : "Not yet marked"}</small></li>;
            })}
          </ol>
          {(item.fields?.utr || item.fields?.scammer_upi || item.fields?.scammer_contact) && (
            <dl className="case-ids">
              {item.fields.utr && <div><dt>UTR</dt><dd>{item.fields.utr}</dd></div>}
              {item.fields.scammer_upi && <div><dt>Scammer UPI</dt><dd>{item.fields.scammer_upi}</dd></div>}
              {item.fields.scammer_contact && <div><dt>Scammer contact</dt><dd>{item.fields.scammer_contact}</dd></div>}
            </dl>
          )}
          <div className="actions">
            <Link href={`/report/${item.id}#${item.token}`} className="button">Open report</Link>
            <a href="tel:1930" className="button secondary">Call 1930</a>
          </div>
        </article>
      ))}
      <p className="small-text">Anyone with a report&apos;s link can open it, so share links carefully.</p>
    </section>
  );
}
