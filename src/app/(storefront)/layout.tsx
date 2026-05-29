import Link from "next/link";
import { headers } from "next/headers";
import { PageViewTracker } from "@/components/page-view-tracker";
import { StorefrontHeader } from "@/components/storefront-header";
import { STOREFRONT_FOOTER_NAV } from "@/data/storefront-navigation";
import { getSiteCopy } from "@/lib/site-copy";

const FOOTER_LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
] as const;

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copy = await getSiteCopy();
  const labelOverrides = Object.fromEntries(
    copy.navLinks.map((link) => [link.href, link.label]),
  );
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isMissionHub =
    pathname === "/community" || pathname.startsWith("/community/");

  if (isMissionHub) {
    return (
      <div className="min-h-dvh bg-[#ebe8e4] text-brand-ink">
        <PageViewTracker />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-ink">
      <PageViewTracker />
      <StorefrontHeader siteName={copy.site.name} labelOverrides={labelOverrides} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-primary/25 bg-white/40 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-brand-ink/80">
          <p className="font-serif text-lg text-brand-primary tracking-wide">{copy.site.name}</p>
          {copy.footer.blurb.trim() ? (
            <p className="mt-2 max-w-lg mx-auto leading-relaxed">{copy.footer.blurb}</p>
          ) : null}
          <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-brand-ink/90">
            {STOREFRONT_FOOTER_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-brand-primary transition-colors">
                {label}
              </Link>
            ))}
            {FOOTER_LEGAL.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-brand-primary transition-colors">
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-brand-ink/60">
            © {new Date().getFullYear()} {copy.site.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
