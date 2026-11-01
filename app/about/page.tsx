import { REPO } from "@/lib/site";

export const metadata = { title: "About - Saakshya" };

export default function About() {
  return (
    <article className="narrow prose">
      <h1>About Saakshya</h1>
      <p className="lead">Saakshya means evidence. It helps people affected by cybercrime turn what happened into a clear draft and a list of next steps.</p>
      <h2>What it does</h2>
      <ul>
        <li>Takes your story by voice or text.</li>
        <li>Blocks OTPs and PINs, and hides ID numbers from the AI.</li>
        <li>Finds the details still missing, such as a UTR.</li>
        <li>Suggests law sections from stored Act text, and shows the wording.</li>
        <li>Holds back any draft containing a number you did not give.</li>
        <li>Keeps a dated record of the steps you take, which shows if it was changed.</li>
      </ul>
      <h2>What it is not</h2>
      <p>Saakshya is an independent hackathon project. It is not a government service, a law firm or a bank. It cannot file a report, freeze money or get money back.</p>
      <p>The code is public on <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>. Photos are illustrative stock images from Pexels and Unsplash; the people pictured are not identified as victims or users of Saakshya.</p>
    <h2>Photography sources</h2>
      <ul>
        <li><a href="https://www.pexels.com/photo/woman-using-laptop-while-holding-cellphone-8837758/" target="_blank" rel="noreferrer">Phone and laptop photograph — Yan Krukau / Pexels</a></li>
        <li><a href="https://www.pexels.com/photo/focused-young-indian-woman-typing-laptop-at-home-4307970/" target="_blank" rel="noreferrer">Laptop at home — Ketut Subiyanto / Pexels</a></li>
        <li><a href="https://www.pexels.com/photo/profile-of-a-senior-woman-wearing-a-floral-blouse-using-laptop-19485860/" target="_blank" rel="noreferrer">Senior laptop user — Siddharth Vyas / Pexels</a></li>
      </ul>
    </article>
  );
}
