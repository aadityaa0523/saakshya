"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import type { Step, TriageResult } from "@/lib/agent";
import { LANGUAGES, rememberReport } from "@/lib/client";
import { recordingToWav } from "@/lib/wav";

const SAMPLES = [
  "A man said he was from my bank and sent a link. I paid ₹12,000 through UPI to him just now.",
  "A loan app is sending my photos to my contacts and demanding more money.",
];

// Each tick comes from a real step reported by the server, not a timer
const STAGES: [string, string][] = [
  ["safety_guard", "Protecting your private details"],
  ["extract_fields", "Understanding what happened"],
  ["lookup_ifsc", "Looking up your bank branch"],
  ["search_law", "Finding laws that may apply"],
  ["fact_check", "Drafting and fact-checking your complaint"],
];

export default function NewReport() {
  const router = useRouter();
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("category") ?? "";
    if (["Financial fraud", "Threats & blackmail", "Identity misuse", "Online shopping scams", "Online harassment", "Something else"].includes(selected)) setCategory(selected);
  }, []);
  const [language, setLanguage] = useState("English");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saakshya-language");
      if (saved && LANGUAGES.some(([name]) => name === saved)) setLanguage(saved);
    } catch {}
  }, []);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [reading, setReading] = useState(false);
  const [attached, setAttached] = useState<File | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  async function toggleRecording() {
    if (recorder.current) {
      recorder.current.stop();
      return;
    }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorder.current = null;
        setRecording(false);
        setHearing(true);
        const form = new FormData();
        try {
          form.append("file", new File([await recordingToWav(new Blob(chunks))], "voice.wav", { type: "audio/wav" }));
          const response = await fetch("/api/transcribe", { method: "POST", body: form });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          setStory((current) => [current, body.transcript].filter(Boolean).join(" "));
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : "We could not hear that. Please type instead.");
        }
        setHearing(false);
      };
      media.start();
      // 16 kHz audio reaches the 4 MB upload limit at about two minutes
      setTimeout(() => { if (media.state === "recording") media.stop(); }, 110_000);
      recorder.current = media;
      setRecording(true);
    } catch {
      setError("We could not use your microphone. Please allow it, or type instead.");
    }
  }

  async function readScreenshot(file: File) {
    setReading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/read-screenshot", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "We could not read that image. Please type the details instead.");
      setStory((current) => [current, body.facts].filter(Boolean).join("\n").slice(0, 5000));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We could not read that image. Please type the details instead.");
    }
    setReading(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSteps([]);
    window.scrollTo(0, 0);
    try {
      const response = await fetch("/api/triage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ story, language }) });
      if (!response.ok) throw new Error((await response.json()).error);
      const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const message: { step?: Step; error?: string; result?: TriageResult; id?: string; token?: string } = JSON.parse(line);
          if (message.step) setSteps((current) => [...current, message.step!]);
          if (message.error) throw new Error(message.error);
          if (message.result) {
            rememberReport({ id: message.id!, token: message.token!, category: message.result.fields.category, priority: message.result.priority, savedAt: new Date().toISOString() });
            if (message.result.urgency === "crisis") setCrisis(true);
            else {
              if (attached) {
                const form = new FormData();
                form.append("file", attached);
                // The report is already safe, so a failed upload can be retried from the report page
                await fetch(`/api/reports/${message.id}/evidence`, { method: "POST", headers: { "x-report-token": message.token! }, body: form }).catch(() => {});
              }
              router.push(`/report/${message.id}#${message.token}`);
            }
          }
        }
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We could not finish this right now. If money was sent, call 1930 now.");
    }
    setBusy(false);
  }

  if (crisis) {
    return (
      <section className="panel urgent-panel" role="alert">
        <h1>You matter more than this report.</h1>
        <p>Losing money or being threatened can feel impossible, but you do not have to face this alone. Please talk to someone now.</p>
        <p><a className="button urgent" href="tel:14416">Call Tele-MANAS: 14416</a></p>
        <p>If you are in immediate danger, call 112. The report can wait.</p>
      </section>
    );
  }

  if (busy) {
    const hasIfsc = steps.some((step) => step.tool === "lookup_ifsc");
    const current = STAGES.filter(([tool]) => tool !== "lookup_ifsc" || hasIfsc);
    const nextIndex = current.findIndex(([tool]) => !steps.some((step) => step.tool === tool));
    return (
      <section className="narrow processing" role="status" aria-live="polite">
        <h1>Reading your report</h1>
        <p className="lead">This usually takes a few seconds. If money was sent, you can <a href="tel:1930">call 1930</a> while you wait.</p>
        <ol className="stage-list">
          {current.map(([tool, label], index) => {
            const step = steps.find((candidate) => candidate.tool === tool);
            return <li key={tool} className={step ? step.status : index === nextIndex ? "active" : "pending"}><span aria-hidden="true">{step ? (step.status === "ok" ? "✓" : "!") : ""}</span><div><strong>{label}</strong>{step && <small>{step.detail}</small>}</div></li>;
          })}
        </ol>
      </section>
    );
  }

  return (
    <section className="narrow">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Prepare a report</span></nav>
      <p className="eyebrow">Complaint preparation</p>
      <h1>What happened?</h1>
      <p className="lead">Use your own words. Include the amount, bank, UTR and the scammer&apos;s number or UPI ID if you have them.</p>
      <ol className="form-progress" aria-label="Preparation stages"><li aria-current="step"><b>1</b> Your account</li><li><b>2</b> Review draft</li><li><b>3</b> Next steps</li></ol>
      {category && <p className="category-note">You selected: <strong>{category}</strong>. Describe what happened below; your account determines the report details.</p>}
      <div className="panel warning"><strong>Never type your OTP, PIN, CVV or password.</strong> Saakshya does not need them.</div>
      <form onSubmit={submit} className="report-form">
        <label htmlFor="language">Language for your draft</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
          {LANGUAGES.map(([name, native]) => <option key={name} value={name}>{native} ({name})</option>)}
        </select>

        <div className="intake-grid">
          <div className="intake-voice">
            <p className="intake-label">Voice note</p>
            <button type="button" className={`mic-button ${recording ? "is-recording" : ""}`} onClick={toggleRecording} disabled={busy || hearing} aria-label={recording ? "Stop recording" : "Start recording"}><Icon name="mic"/></button>
            <p className="field-help" aria-live="polite">{recording ? "Recording. Tap to stop." : hearing ? "Listening back..." : "Tap the mic and speak. You can check the words afterwards."}</p>
          </div>
          <div className="intake-side">
            <label htmlFor="story">Type what happened</label>
            <textarea id="story" rows={7} maxLength={5000} required minLength={10} value={story} onChange={(event) => setStory(event.target.value)} aria-describedby="story-help" placeholder="Tell us what happened, when it happened, and any details you remember…" />
            <p className="field-help" id="story-help">{story.length.toLocaleString()} / 5,000 characters. You will review everything before using it.</p>

            <label htmlFor="screenshot">Attach a payment screenshot or scam message (optional)</label>
            {attached ? (
              <p className="attached-file"><span>✓ {attached.name}</span><button type="button" className="link" onClick={() => setAttached(null)}>Remove</button></p>
            ) : (
              <input id="screenshot" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy || reading} onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setAttached(file);
                if (file.type !== "application/pdf") readScreenshot(file);
              }} />
            )}
            <p className="field-help">{reading ? "Reading your screenshot..." : "Images are read and their details added to your story for you to check. The file then joins your evidence. Crop out any OTP or PIN first, and never attach sexual images."}</p>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="button wide" disabled={busy || recording || hearing || reading}>Prepare my report<Icon name="arrow"/></button>
        </div>
      </form>

      <div className="samples">
        <span>Trying it out? Fill in a made-up sample story:</span>
        {SAMPLES.map((sample) => <button type="button" key={sample} className="link" onClick={() => setStory(sample)}>{sample}</button>)}
      </div>

      {steps.length > 0 && (
        <ol className="agent-steps" aria-live="polite">
          {steps.map((step, index) => <li key={index} className={step.status}><strong>{step.tool.replace(/_/g, " ")}</strong> <span>{step.detail}</span></li>)}
        </ol>
      )}
      {error && <p className="panel error" role="alert">{error}</p>}
    </section>
  );
}
