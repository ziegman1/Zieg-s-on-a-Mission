export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/blog/blog-post-body";
import { getBlogPostBySlug, getPublishedBlogSlugs } from "@/lib/blog/blog-db";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt.trim() || undefined,
    openGraph: post.featuredImageUrl
      ? { images: [{ url: post.featuredImageUrl, alt: post.featuredImageAlt || post.title }] }
      : undefined,
  };
}

function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const dateLabel = formatPostDate(post.publishedAt);

  return (
    <article className="bg-brand-surface text-brand-ink min-h-[50vh]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link
          href="/blog"
          className="text-sm font-medium text-brand-primary hover:underline inline-flex items-center gap-1"
        >
          ← Back to blog
        </Link>

        {dateLabel ? (
          <time
            dateTime={post.publishedAt ?? undefined}
            className="mt-6 block text-xs font-semibold uppercase tracking-wider text-brand-primary/70"
          >
            {dateLabel}
          </time>
        ) : null}

        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide leading-tight">
          {post.title}
        </h1>

        {post.featuredImageUrl ? (
          <figure className="mt-8 overflow-hidden rounded-2xl ring-1 ring-brand-primary/12 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full aspect-[16/10] object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-8 sm:mt-10">
          <BlogPostBody body={post.body} className="text-base sm:text-[17px]" />
        </div>

        <nav className="mt-14 pt-8 border-t border-brand-primary/20">
          <Link href="/blog" className="text-brand-primary font-semibold hover:underline">
            ← All posts
          </Link>
        </nav>
      </div>
    </article>
  );
}
