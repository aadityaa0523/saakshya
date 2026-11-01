import { PostCards } from "../PostCards";

export const metadata = { title: "Guides - Saakshya" };

export default function Blog() {
  return (
    <section>
      <h1>Guides and scam alerts</h1>
      <p className="lead">Practical help for staying safe online and acting quickly when something goes wrong.</p>
      <PostCards />
    </section>
  );
}
