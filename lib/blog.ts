export const photo = (id: string, width = 900) => id.startsWith("/") ? id : `https://images.unsplash.com/photo-${id}?w=${width}&q=70&auto=format&fit=crop`;

export type Post = { slug: string; tag: string; title: string; summary: string; image: string; alt: string; sections: [string, string[]][] };

export const POSTS: Post[] = [
  {
    slug: "first-hour-after-cyber-fraud",
    tag: "First steps",
    title: "Lost money online? What to do in the first hour",
    summary: "Fast reporting gives the best chance of stopping the money. Here is the order to do things in.",
    image: "/media/hero-citizen.jpg",
    alt: "A woman using a phone beside her laptop",
    sections: [
      ["Do this now", ["Call 1930, the national cyber fraud helpline.", "Call your bank using the number on your card or its official app, and ask it to block the transaction and your compromised channels.", "File a complaint at cybercrime.gov.in and note the acknowledgement number."]],
      ["Keep these details", ["The UTR or transaction ID, amount, date and time.", "The scammer's number, UPI ID, website or profile link.", "Screenshots of messages, and payment confirmations."]],
      ["Do not", ["Do not delete messages or call logs, even if they are upsetting.", "Do not pay anyone who promises to get your money back."]],
    ],
  },
  {
    slug: "digital-arrest-scam",
    tag: "Scam alert",
    title: "Digital arrest is a scam. Here is how to spot it",
    summary: "Callers pose as police or officials, keep you on video and demand money. Real officers do not work this way.",
    image: "/media/phone-call.jpg",
    alt: "A person talking on the phone",
    sections: [
      ["How it works", ["A caller claims a parcel, SIM or bank account in your name is linked to a crime.", "You are told to stay on a video call, keep it secret and move money to clear your name."]],
      ["The warning signs", ["Threats of immediate arrest over a call.", "Being told not to hang up or tell your family.", "Fake uniforms, offices or documents on video.", "Any demand to pay for verification."]],
      ["What to do", ["Hang up. Staying on the call is how they control you.", "Tell someone you trust.", "Report it on 1930 or at cybercrime.gov.in. If you are in danger, call 112."]],
    ],
  },
  {
    slug: "fake-recovery-agents",
    tag: "Stay safe",
    title: "Beware of fake recovery agents",
    summary: "After one scam, a second often follows. Learn how people pretend to help you get your money back.",
    image: "/media/senior-online.jpg",
    alt: "An older woman using her laptop",
    sections: [
      ["Who they are", ["People who claim to be recovery experts, lawyers, bank staff or officials, often found through social media or fake helpline listings."]],
      ["The warning signs", ["They guarantee your money back.", "They ask for a fee, an OTP, a PIN or remote access to your phone.", "They contact you first and already know about your loss."]],
      ["What to do", ["Use only numbers from your bank's official app or your card.", "Never install a screen-sharing app because someone told you to.", "Report them on 1930 or at cybercrime.gov.in."]],
    ],
  },
  {
    slug: "what-to-keep-as-evidence",
    tag: "Evidence",
    title: "What to save as evidence after a scam",
    summary: "A simple list of what helps your bank and the police, and what you should never upload anywhere.",
    image: "/media/evidence-phone.jpg",
    alt: "A person reviewing messages on a phone",
    sections: [
      ["Save these", ["Full-screen screenshots showing dates and sender details.", "Bank SMS alerts and account statements for the affected period.", "Links, phone numbers, UPI IDs and profile addresses."]],
      ["Keep it safe", ["Keep the originals on your phone, and make a backup.", "Write down what happened and when while you remember it."]],
      ["Never share", ["OTPs, PINs, CVVs or passwords, with anyone.", "If someone is threatening you with intimate images, do not forward them. Use the official portal at cybercrime.gov.in, which has a dedicated route for such cases."]],
    ],
  },
];
