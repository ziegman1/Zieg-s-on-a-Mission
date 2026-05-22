import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MissionHubPageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-3 pb-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-serif text-lg sm:text-xl text-brand-ink/92 tracking-wide leading-snug">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] sm:text-[13px] text-brand-ink/50 leading-snug">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-0.5">{action}</div> : null}
    </header>
  );
}
