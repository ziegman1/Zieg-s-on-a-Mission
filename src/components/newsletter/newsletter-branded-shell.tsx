import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import { newsletterBrandCssVars } from "@/lib/newsletter/resolve-header";
import { cn } from "@/lib/utils";

export function NewsletterBrandedShell({
  brand,
  children,
  className,
}: {
  brand: NewsletterBrandSettings;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("min-h-[50vh] text-brand-ink", className)}
      style={{
        ...newsletterBrandCssVars(brand),
        backgroundColor: "var(--newsletter-bg, #F7F3EB)",
      }}
    >
      {children}
    </div>
  );
}
