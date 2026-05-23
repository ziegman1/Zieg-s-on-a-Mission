import type { ResolvedNewsletterFooter } from "@/lib/newsletter/resolve-footer";

export function NewsletterBrandedFooter({
  footer,
  className,
}: {
  footer: ResolvedNewsletterFooter;
  className?: string;
}) {
  if (footer.imageUrl?.trim()) {
    return (
      <footer className={className} data-testid="newsletter-branded-footer-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={footer.imageUrl}
          alt={footer.alt}
          className="w-full h-auto block"
        />
      </footer>
    );
  }

  if (footer.text.trim()) {
    return (
      <footer className={className} data-testid="newsletter-branded-footer-text">
        <p className="text-center text-sm text-brand-ink/65 leading-relaxed max-w-xl mx-auto px-4">
          {footer.text}
        </p>
      </footer>
    );
  }

  return null;
}
