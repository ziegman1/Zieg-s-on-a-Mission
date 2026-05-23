import type { ResolvedNewsletterHeader } from "@/lib/newsletter/resolve-header";

export function NewsletterBrandedHeader({
  header,
  className = "",
}: {
  header: ResolvedNewsletterHeader;
  className?: string;
}) {
  if (!header.imageUrl?.trim()) return null;

  return (
    <header className={className}>
      <div
        className="h-1 w-full"
        style={{ backgroundColor: "var(--newsletter-line, #B8D4E8)" }}
        aria-hidden
      />
      <figure className="relative w-full overflow-hidden bg-[var(--newsletter-accent,#D4E8F5)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={header.imageUrl}
          alt={header.alt}
          className="w-full h-auto object-contain object-center"
        />
      </figure>
      <div
        className="h-1 w-full"
        style={{ backgroundColor: "var(--newsletter-line, #B8D4E8)" }}
        aria-hidden
      />
    </header>
  );
}
