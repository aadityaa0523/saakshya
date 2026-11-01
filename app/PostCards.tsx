import Image from "next/image";
import Link from "next/link";
import { photo, POSTS } from "@/lib/blog";

export function PostCards() {
  return (
    <div className="post-grid">
      {POSTS.map((post) => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
          <Image src={photo(post.image, 700)} alt={post.alt} width={700} height={400} unoptimized />
          <div>
            <p className="eyebrow">{post.tag}</p>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
