"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Step, TriageResult } from "@/lib/agent";
import { LANGUAGES, rememberReport } from "@/lib/client";

const SAMPLES = [
  "A man said he was from my bank and sent a link. I paid ₹12,000 through UPI to him just now.",
  "A loan app is sending my photos to my contacts and demanding more money.",
];

export default function NewReport() {
  const router = useRouter();
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState("English");
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hearing, setHearing] = useState(false);
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
        form.append("file", new File(chunks, "voice.webm", { type: "audio/webm" }));
        try {
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
      recorder.current = media;
      setRecording(true);
    } catch {
      setError("We could not use your microphone. Please allow it, or type instead.");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSteps([]);
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
            else router.push(`/report/${message.id}#${message.token}`);
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

  return (
    <section className="narrow">
      <h1>What happened?</h1>
      <p className="lead">Use your own words. Include the amount, bank, UTR and the scammer&apos;s number or UPI ID if you have them.</p>
      <div className="panel warning"><strong>Never type your OTP, PIN, CVV or password.</strong> Saakshya does not need them.</div>
      <form onSubmit={submit}>
        <label htmlFor="language">Language for your draft</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
          {LANGUAGES.map(([name, native]) => <option key={name} value={name}>{native} ({name})</option>)}
        </select>

        <label htmlFor="story">Your story</label>
        <textarea id="story" rows={8} maxLength={5000} required minLength={10} value={story} onChange={(event) => setStory(event.target.value)} />

        <div className="actions">
          <button type="button" className="button secondary" onClick={toggleRecording} disabled={busy || hearing}>
            {recording ? "Stop recording" : hearing ? "Listening back..." : "Speak instead"}
          </button>
          <button type="submit" className="button" disabled={busy || recording || hearing}>{busy ? "Working..." : "Prepare my report"}</button>
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
