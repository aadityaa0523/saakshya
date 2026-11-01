export const metadata = { title: "Privacy policy - Saakshya" };

export default function Privacy() {
  return (
    <article className="narrow prose">
      <h1>Privacy policy</h1>
      <h2>What we store</h2>
      <ul>
        <li>Your story, with PAN, Aadhaar, card and account numbers masked first.</li>
        <li>Details you give for the report, such as the amount, your bank, the UTR, and the scammer&apos;s number or UPI ID.</li>
        <li>The draft, suggested laws, and a dated record of the steps you mark.</li>
      </ul>
      <p>No account is needed. A private link opens your report, and the list on My reports is kept in your own browser.</p>
      <h2>What we refuse</h2>
      <p>Text with a labelled OTP, PIN, CVV or password is rejected and not saved. A number with no label may not be recognised, so please never enter one.</p>
      <h2>Who else handles it</h2>
      <ul>
        <li>An AI provider receives the masked story to read it and write your draft.</li>
        <li>Sarvam AI receives voice notes to turn them into text. We do not store the audio.</li>
        <li>Razorpay&apos;s public lookup receives an IFSC code, if you give one.</li>
        <li>Twilio and WhatsApp carry your messages, if you use WhatsApp.</li>
        <li>Our hosting and database providers store and serve the app.</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>Reports stay until you delete them. The button at the bottom of each report removes it and its record permanently.</p>
    </article>
  );
}
