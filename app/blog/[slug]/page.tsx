import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { photo, POSTS } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map(({ slug }) => ({ slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((candidate) => candidate.slug === slug);
  if (!post) notFound();
  return (
    <article className="narrow prose">
      <p className="eyebrow">{post.tag}</p>
      <h1>{post.title}</h1>
      <p className="lead">{post.summary}</p>
      <Image className="post-hero" src={photo(post.image, 1200)} alt={post.alt} width={1200} height={600} unoptimized priority />
      {post.sections.map(([heading, items]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ))}
      <p className="panel">General guidance, not legal advice. Official reporting: <a href="tel:1930">1930</a> or <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a>.</p>
      <div className="actions"><Link href="/new" className="button">Start a report</Link></div>
    </article>
  );
}
