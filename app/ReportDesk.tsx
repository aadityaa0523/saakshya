"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveDraft } from "@/lib/client";
import { useVoice } from "@/lib/useVoice";
import { Icon } from "./Icons";

const SAMPLES = [
  "A man said he was from my bank and sent a link. I paid ₹12,000 through UPI to him just now.",
  "A loan app is sending my photos to my contacts and demanding more money.",
  "Someone made a fake Instagram profile using my name and photos.",
];

/** Words stay in this browser until the person submits them on the report page. */
export function ReportDesk() {
  const router = useRouter();
  const [error, setError] = useState("");
  const send = (text: string) => {
    saveDraft(text);
    router.push("/new");
  };
  const voice = useVoice(send, setError);
  return (
    <section className="report-desk" aria-label="Start with your voice">
      <header><strong>Report desk</strong><span className="desk-status">{voice.recording ? "Recording" : voice.hearing ? "Listening back" : "Ready"}</span></header>
      <p className="desk-prompt">Tap the mic and tell us what happened</p>
      <button type="button" className={`mic-button ${voice.recording ? "is-recording" : ""}`} onClick={voice.toggle} disabled={voice.hearing} aria-label={voice.recording ? "Stop recording" : "Start recording"}><Icon name="mic"/></button>
      <p className="field-help" aria-live="polite">{voice.recording ? "Recording. Tap to stop." : voice.hearing ? "Turning your words into text..." : "Speak in your own language. You check the words next."}</p>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="desk-samples">
        <span>Or try a made-up example:</span>
        {SAMPLES.map((sample) => <button type="button" key={sample} onClick={() => send(sample)}>{sample}</button>)}
      </div>
    </section>
  );
}
