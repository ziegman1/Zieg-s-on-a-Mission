import type { Metadata } from "next";
import Link from "next/link";
import { MinistryPageShell } from "@/components/ministry-page-shell";
import { getSiteCopy } from "@/lib/site-copy";
import { renderStorefrontPage } from "@/lib/site-builder/render-page";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "About",
    description: `Learn about ${copy.site.name} — who we are and how monthly partnership sustains the mission.`,
  };
}

async function LegacyAboutPage() {
  const copy = await getSiteCopy();
  const { title, lede, sections } = copy.about;

  return (
    <MinistryPageShell title={title} lede={lede}>
      {sections
        .filter((s) => s.heading.trim() || s.body.trim())
        .map((s) => (
          <section key={s.heading}>
            {s.heading.trim() ? <h2>{s.heading}</h2> : null}
            {s.body.trim() ? <p>{s.body}</p> : null}
          </section>
        ))}
      <nav className="!mt-12 pt-8 border-t border-brand-primary/25 flex flex-wrap gap-4 not-prose">
        <Link href="/partner" className="text-brand-primary font-medium hover:underline">
          Become a partner →
        </Link>
        <Link href="/give" className="text-brand-primary font-medium hover:underline">
          Give
        </Link>
        <Link href="/mission" className="text-brand-primary font-medium hover:underline">
          Our mission →
        </Link>
        <Link href="/blog" className="text-brand-primary font-medium hover:underline">
          Blog
        </Link>
        <Link href="/contact" className="text-brand-primary font-medium hover:underline">
          Contact
        </Link>
      </nav>
    </MinistryPageShell>
  );
}

export default async function AboutPage() {
  return renderStorefrontPage("about", LegacyAboutPage);
}
