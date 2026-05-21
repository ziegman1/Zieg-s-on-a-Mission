import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunityAuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md border-black/[0.06] bg-white/95 shadow-[0_12px_40px_rgba(28,42,68,0.1)] rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-2xl text-brand-ink tracking-wide">{title}</CardTitle>
          <CardDescription className="text-brand-ink/65 text-[15px] leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer}
        </CardContent>
      </Card>
      <p className="mt-6 text-center">
        <Link href="/community" className="text-sm font-medium text-brand-primary hover:underline">
          ← Back to Mission Hub
        </Link>
      </p>
    </div>
  );
}
