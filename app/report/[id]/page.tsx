"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { bankRequest, callScript, completeness, contactsFor } from "@/lib/actions";
import { missingFields, type Fields, type LawCandidate } from "@/lib/agent";
import { forgetReport, rememberReport, savedReports } from "@/lib/client";

type Report = {
  fields: Fields; laws: (LawCandidate & { reason: string })[]; draft: string | null; draft_translated: string | null;
  priority: string; urgency: string; language: string; created_at: string;
};
type Event = { at: string; event: { type: string; acknowledgement?: string | null }; hash: string };

const EDITABLE: [keyof Fields, string][] = [
  ["utr", "UTR (12 digits)"], ["bank_name", "Your bank"], ["ifsc", "IFSC"], ["scammer_upi", "Scammer's UPI ID"], ["scammer_contact", "Scammer's number or profile"],
];
const ACTIONS: [string, string][] = [
  ["called_1930", "I called 1930"], ["told_bank", "I told my bank"], ["filed_portal", "I filed on cybercrime.gov.in"], ["filed_police", "I went to the police"],
];

type EvidenceFile = { id: string; name: string; size: number; sha256: string };

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [update, setUpdate] = useState("");
  const [busy, setBusy] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState("");
  const [chain, setChain] = useState<{ valid: boolean; events: Event[] } | null>(null);
  const [files, setFiles] = useState<EvidenceFile[]>([]);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", "x-report-token": token, ...init?.headers } });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? "That did not work. Please try again.");
    return body;
  }, [token]);

  useEffect(() => {
    setToken(window.location.hash.slice(1) || (savedReports().find((saved) => saved.id === id)?.token ?? ""));
  }, [id]);

  const refreshChain = useCallback(() => Promise.all([
    api(`/reports/${id}/verify`).then(setChain),
    api(`/reports/${id}/evidence`).then((body) => setFiles(body.files)),
  ]), [api, id]);

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/reports/${id}/evidence`, { method: "POST", headers: { "x-report-token": token }, body: form });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "That file could not be added.");
    await refreshChain();
  }

  async function download(file: EvidenceFile) {
    const response = await fetch(`/api/reports/${id}/evidence/${file.id}`, { headers: { "x-report-token": token } });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "That file could not be opened.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  useEffect(() => {
    if (!token) return;
    api(`/reports/${id}`).then((loaded: Report) => {
      setReport(loaded);
      rememberReport({ id, token, category: loaded.fields.category, priority: loaded.priority, savedAt: loaded.created_at });
      return refreshChain();
    }).catch((failure: Error) => setError(failure.message));
  }, [token, id, api, refreshChain]);

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(done);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That did not work. Please try again.");
    }
    setBusy(false);
  }

  if (!report) return <section className="narrow">{error ? <p className="panel error" role="alert">{error}. Check that you opened the full link.</p> : <p>Loading your report...</p>}</section>;

  const { fields } = report;
  const missing = missingFields(fields);
  const score = completeness(fields);
  const script = callScript(fields);
  const bankLetter = bankRequest(fields);
  const contacts = contactsFor(fields.category);
  const patch = (change: object) => run(async () => {
    const saved = await api(`/reports/${id}`, { method: "PATCH", body: JSON.stringify(change) });
    setReport({ ...report, ...change, fields: saved.fields });
    await refreshChain();
  }, "Saved.");
  const done = new Set(chain?.events.map((entry) => entry.event.type));

  return (
    <div className="report">
      <div className="report-head">
        <div>
          <h1>{fields.category}</h1>
          <p>{report.priority} priority{fields.amount ? `, ₹${fields.amount.toLocaleString("en-IN")} reported lost` : ""}</p>
        </div>
        <button className="button secondary no-print" onClick={() => window.print()}>Save as PDF</button>
      </div>

      {report.urgency === "ongoing" && <p className="panel urgent-panel" role="alert"><strong>If you are still on a call with them, hang up now.</strong> Police do not arrest anyone over a video call or ask you to pay to clear your name.</p>}
      {report.urgency === "recent" && <p className="panel urgent-panel" role="alert"><strong>Call 1930 now.</strong> The sooner it is reported, the better the chance of stopping the money. You can finish this page afterwards.</p>}
      {error && <p className="panel error no-print" role="alert">{error}</p>}
      {notice && <p className="panel notice no-print" role="status">{notice}</p>}

      <section className="panel">
        <h2>What we understood</h2>
        <p>{fields.summary}</p>
        <div className="readiness">
          <p><strong>Report readiness: {score.done} of {score.total} key details</strong></p>
          <div className="readiness-bar" role="progressbar" aria-valuenow={score.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Report readiness"><span style={{ width: `${score.percent}%` }} /></div>
          <ul>{score.items.map((item) => <li key={item.name} className={item.done ? "ok-text" : ""}>{item.done ? "✓" : "○"} {item.name}</li>)}</ul>
        </div>
        {missing.length > 0 ? <p><strong>Still needed:</strong> {missing.join(", ")}. Add them below when you can.</p> : <p><strong>All key details are in.</strong></p>}
      </section>

      <section className="panel no-print">
        <h2>Your call and bank kit</h2>
        <h3>What to say when you call 1930</h3>
        <ol>{script.map((line) => <li key={line}>{line}</li>)}</ol>
        <div className="actions">
          <a className="button urgent" href="tel:1930">Call 1930</a>
          <button className="button secondary" onClick={() => run(() => navigator.clipboard.writeText(script.join("\n")), "Call script copied.")}>Copy script</button>
        </div>
        {bankLetter && <>
          <h3>Request to send your bank</h3>
          <p className="small-text">Saakshya does not contact your bank. Fill in the blanks and send this yourself, using your bank&apos;s official app, website or the number on your card.</p>
          <p className="pre letter">{bankLetter}</p>
          <button className="button secondary" onClick={() => run(() => navigator.clipboard.writeText(bankLetter), "Bank request copied.")}>Copy bank request</button>
        </>}
        <h3>Official contacts for this kind of report</h3>
        <ul className="contact-list">{contacts.map(([name, detail, href]) => <li key={name}><a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{name}</a>: {detail}</li>)}</ul>
      </section>

      <section className="panel no-print">
        <h2>Do this next</h2>
        <ol className="checklist">
          {ACTIONS.map(([action, label]) => (
            <li key={action}>
              <button className="link" disabled={busy || done.has(action)} onClick={() => run(async () => {
                await api(`/reports/${id}/actions`, { method: "POST", body: JSON.stringify({ action, acknowledgement }) });
                setAcknowledgement("");
                await refreshChain();
              }, "Recorded with today's date and time.")}>
                {done.has(action) ? "Done: " : "Mark done: "}{label}
              </button>
            </li>
          ))}
        </ol>
        <label htmlFor="ack">Acknowledgement number, if you were given one (recorded with the next step you mark)</label>
        <input id="ack" maxLength={40} value={acknowledgement} onChange={(event) => setAcknowledgement(event.target.value)} />
        <p><a href="tel:1930">Call 1930</a> · <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Open cybercrime.gov.in</a></p>
      </section>

      <section className="panel">
        <h2>Details</h2>
        <div className="field-grid">
          {EDITABLE.map(([key, label]) => (
            <div key={`${key}-${String(fields[key])}`}>
              <label htmlFor={key}>{label}</label>
              <input id={key} defaultValue={(fields[key] as string | null) ?? ""} onBlur={(event) => { if (event.target.value.trim() !== ((fields[key] as string | null) ?? "")) patch({ [key]: event.target.value.trim() }); }} />
            </div>
          ))}
        </div>
        {fields.bank_branch && <p>Branch from IFSC: {fields.bank_branch}</p>}
        <form className="no-print" onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const saved = await api("/followup", { method: "POST", body: JSON.stringify({ id, text: update }) });
            setReport({ ...report, fields: saved.fields });
            setUpdate("");
            await refreshChain();
          }, "Update added.");
        }}>
          <label htmlFor="update">Remembered something? Write it here, for example: UTR is 482910394821, bank is SBI.</label>
          <textarea id="update" rows={2} maxLength={2000} required value={update} onChange={(event) => setUpdate(event.target.value)} />
          <button className="button secondary" disabled={busy}>Add update</button>
        </form>
      </section>

      <section className="panel">
        <h2>Laws that may apply</h2>
        {report.laws.length === 0 ? <p>No matching section was found. A police officer or lawyer can advise you.</p> : report.laws.map((law) => (
          <details key={law.id} open>
            <summary>{law.act}, section {law.section}</summary>
            <p>{law.reason}</p>
            <blockquote>{law.text.slice(0, 600)}</blockquote>
            <a href={law.source_url} target="_blank" rel="noreferrer">Official source</a>
          </details>
        ))}
        <p className="small-text">Suggestions only, not legal advice. Confirm with police or a lawyer.</p>
      </section>

      <section className="panel">
        <h2>Complaint draft</h2>
        {report.draft === null ? <p>We held this draft back because it did not pass our fact check. Add more detail in an update, or write your own using the details above.</p> : (
          <>
            <textarea rows={12} aria-label="Complaint draft" key={report.draft} defaultValue={report.draft} onBlur={(event) => { if (event.target.value !== report.draft) patch({ draft: event.target.value }); }} />
            <button className="button secondary no-print" onClick={() => run(() => navigator.clipboard.writeText(report.draft ?? ""), "Copied.")}>Copy draft</button>
            {report.draft_translated && report.language !== "English" && <><h3>In {report.language}</h3><p className="pre">{report.draft_translated}</p></>}
          </>
        )}
      </section>

      <section className="panel">
        <h2>Evidence</h2>
        {fields.category === "Women/Children Related Crime" ? (
          <p>Please do not upload files for this kind of report. Use the official portal at <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a>, which has a dedicated route.</p>
        ) : (
          <>
            <p className="small-text">Add screenshots or payment proof as JPG, PNG, WebP or PDF, up to 4 MB each. Never upload sexual images, or anything showing an OTP or PIN. Each file gets a fingerprint in your dated record, so any later change shows.</p>
            <label htmlFor="evidence" className="no-print">Add a file</label>
            <input id="evidence" className="no-print" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) run(() => upload(file), "File added to your record.");
            }} />
          </>
        )}
        {files.length > 0 && <ul className="events">
          {files.map((file) => <li key={file.id}><button className="link" disabled={busy} onClick={() => run(() => download(file), "Download started.")}>{file.name}</button> ({Math.ceil(file.size / 1024)} KB, fingerprint {file.sha256.slice(0, 12)})</li>)}
        </ul>}
      </section>

      <section className="panel">
        <h2>Your dated record</h2>
        {chain && <p className={chain.valid ? "ok-text" : "error-text"}>{chain.valid ? "Checked: this record has not been changed." : "Warning: this record has been changed since it was written."}</p>}
        <ul className="events">
          {chain?.events.map((entry) => <li key={entry.hash}>{new Date(entry.at).toLocaleString("en-IN")}: {entry.event.type.replace(/_/g, " ")}{entry.event.acknowledgement ? ` (acknowledgement ${entry.event.acknowledgement})` : ""}</li>)}
        </ul>
      </section>

      <button className="link danger no-print" disabled={busy} onClick={() => {
        if (!window.confirm("Delete this report permanently?")) return;
        run(async () => {
          await api(`/reports/${id}`, { method: "DELETE" });
          forgetReport(id);
          router.push("/reports");
        }, "Deleted.");
      }}>Delete this report</button>
    </div>
  );
}
