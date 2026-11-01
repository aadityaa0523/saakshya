"use client";
import { useState } from "react";
import { Icon } from "./Icons";
// Saakshya's own wording. Government campaign art carries the national emblem, so it is not reproduced here.
const campaigns = [
  { lang: "hi", label: "हिन्दी", number: "1930", headline: "ऑनलाइन धोखाधड़ी? तुरंत 1930 पर कॉल करें।", detail: "शिकायत cybercrime.gov.in पर दर्ज करें।" },
  { lang: "en", label: "English", number: "1930", headline: "Lost money online? Dial 1930 right away.", detail: "Report any cybercrime at cybercrime.gov.in." },
];
export function CampaignBanner() {
  const [index, setIndex] = useState(0);
  const item = campaigns[index];
  return <div className="campaign-carousel" role="region" aria-roledescription="carousel" aria-label="Cybercrime awareness messages">
    <a className="campaign-image campaign-message" lang={item.lang} href="https://cybercrime.gov.in" target="_blank" rel="noreferrer"><strong>{item.number}</strong><span><b>{item.headline}</b>{item.detail}</span></a>
    <div className="campaign-controls"><div aria-live="polite"><strong lang={item.lang}>{item.headline}</strong><span>Awareness message by Saakshya · <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Official portal <Icon name="external"/></a></span></div><div className="slide-buttons"><button onClick={() => setIndex((index + campaigns.length - 1) % campaigns.length)} aria-label="Previous message">←</button><div className="slide-dots">{campaigns.map((slide, i) => <button key={slide.lang} aria-label={`Show ${slide.label} message`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div><button onClick={() => setIndex((index + 1) % campaigns.length)} aria-label="Next message">→</button></div></div>
  </div>;
}
