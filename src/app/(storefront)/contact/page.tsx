import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../legal/page-shell";
import { getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "Contact",
    description: `Contact ${copy.site.name} — partnership, giving, prayer, and support when the shop is active.`,
  };
}

export default async function ContactPage() {
  const copy = await getSiteCopy();
  const email = copy.legalSupport.supportEmail;
  const { intro, responseExpectation, helpHeading, helpBullets, beforeContactLead } = copy.contact;

  return (
    <LegalPageShell title="Contact">
      <p>{intro}</p>

      <p className="not-prose flex flex-wrap gap-3 mt-6">
        <Link
          href="/partner"
          className="inline-flex rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-accent/90"
        >
          Become a Monthly Partner
        </Link>
        <Link
          href="/give"
          className="inline-flex rounded-full border border-brand-primary/40 px-5 py-2 text-sm font-medium text-brand-ink hover:border-brand-primary/60"
        >
          Give
        </Link>
      </p>

      <h2>Support Email</h2>
      <p>
        <a href={`mailto:${email}`}>{email}</a>
      </p>
      <p className="text-brand-ink/70 text-sm">{responseExpectation}</p>

      <h2>{helpHeading}</h2>
      <p>We can assist with:</p>
      <ul>
        {helpBullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>Before You Contact Us</h2>
      <p>
        {beforeContactLead}{" "}
        <Link href="/shipping">Shipping Policy</Link> and{" "}
        <Link href="/returns">Return & Refund Policy</Link>. Many common questions are covered there.
      </p>

      <p className="mt-8 pt-6 border-t border-brand-primary/25">
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </LegalPageShell>
  );
}
