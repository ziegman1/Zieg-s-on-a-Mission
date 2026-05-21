import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function CommunityAppBackLink({ href = "/community", label = "Mission Hub" }: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-brand-primary/15 px-3 py-1.5 text-sm font-medium text-brand-primary shadow-sm hover:bg-white hover:border-brand-primary/30 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
