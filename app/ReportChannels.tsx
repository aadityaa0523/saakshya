"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveDraft } from "@/lib/client";
import { WHATSAPP_NUMBER } from "@/lib/scams";
import { Icon } from "./Icons";

const TABS = ["Use the web", "WhatsApp", "Call 1930"];

export function ReportChannels() {
  const router = useRouter();
  const [tab, setTab] = useState(TABS[0]);
  const [text, setText] = useState("");
  return (
    <div className="channels">
      <div className="channel-tabs" role="tablist" aria-label="How to report">
        {TABS.map((name) => <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}
      </div>
      {tab === "Use the web" && (
        <form onSubmit={(event) => { event.preventDefault(); saveDraft(text); router.push("/new"); }}>
          <label htmlFor="channel-story" className="visually-hidden">What happened?</label>
          <textarea id="channel-story" rows={3} maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} placeholder="I received a phishing link..." />
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => router.push("/new")}><Icon name="mic"/> Use voice or add a file</button>
            <button type="submit" className="button">Continue <Icon name="arrow"/></button>
          </div>
        </form>
      )}
      {tab === "WhatsApp" && (
        <div>
          <p>Send your story on WhatsApp and get a summary, next steps and a report link back.</p>
          <p className="small-text">This is a test connection. First send the join message that the button fills in. It needs joining again every 3 days.</p>
          <a className="button" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("join anywhere-off")}`} target="_blank" rel="noreferrer">Open WhatsApp <Icon name="external"/></a>
        </div>
      )}
      {tab === "Call 1930" && (
        <div>
          <p>If money was sent, call the national cyber fraud helpline first. Saakshya does not connect you or share your details. You make the call yourself.</p>
          <a className="button urgent" href="tel:1930">Call 1930</a>
        </div>
      )}
    </div>
  );
}
