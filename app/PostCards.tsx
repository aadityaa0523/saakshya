import Image from "next/image";
import Link from "next/link";
import { photo, POSTS } from "@/lib/blog";
import { Icon } from "./Icons";

export function PostCards({ limit }: { limit?: number }) {
  return (
    <div className="post-grid">
      {POSTS.slice(0, limit).map((post) => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
          <Image src={photo(post.image, 700)} alt={post.alt} width={700} height={400} sizes="(max-width: 700px) 100vw, 33vw" />
          <div>
            <p className="eyebrow">{post.tag}</p>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
            <span className="service-link">Read guide <Icon name="arrow"/></span>
          </div>
        </Link>
      ))}
    </div>
  );
}
