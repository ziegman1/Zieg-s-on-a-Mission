export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogIntroSection } from "@/components/blog/blog-intro-section";
import { listPublishedBlogPosts } from "@/lib/blog/blog-db";
import { getSiteCopy } from "@/lib/site-copy";
import { loadPageSections } from "@/lib/site-builder/sections-db";
import { pageHasCustomSections } from "@/lib/site-builder/sections-db";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "Blog",
    description: `Stories, updates, and resources from ${copy.site.name}.`,
  };
}

export default async function BlogPage() {
  const copy = await getSiteCopy();
  const posts = await listPublishedBlogPosts();
  const hasCustom = await pageHasCustomSections("blog");
  const sections = hasCustom ? await loadPageSections("blog") : [];

  return (
    <div className="bg-brand-surface text-brand-ink min-h-[50vh]">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {sections.find((s) => s.sectionKey === "header") ? (
          <BlogIntroSection section={sections.find((s) => s.sectionKey === "header")!} />
        ) : (
          <header className="mb-10 sm:mb-12 max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
              {copy.blog.title}
            </h1>
            <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed">{copy.blog.lede}</p>
            {copy.blog.intro ? (
              <p className="mt-3 text-brand-ink/75 leading-relaxed">{copy.blog.intro}</p>
            ) : null}
          </header>
        )}

        {posts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-primary/15 bg-white/70 px-6 py-10 text-center max-w-xl mx-auto">
            <p className="text-brand-ink/80 leading-relaxed">{copy.blog.emptyNote}</p>
            <p className="mt-6">
              <Link href="/contact" className="text-brand-primary font-semibold hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        )}

        <nav className="mt-14 pt-8 border-t border-brand-primary/20 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/" className="text-brand-primary font-medium hover:underline">
            ← Home
          </Link>
          <Link href="/partner" className="text-brand-primary font-medium hover:underline">
            Become a partner
          </Link>
          <Link href="/mission" className="text-brand-primary font-medium hover:underline">
            Our mission
          </Link>
        </nav>
      </div>
    </div>
  );
}
