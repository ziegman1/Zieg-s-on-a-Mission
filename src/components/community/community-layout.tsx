import type { ReactNode } from "react";

export function CommunityLayout({
  header,
  sidebar,
  children,
}: {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-brand-surface text-brand-ink min-h-[calc(100vh-12rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {header}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,17rem)_1fr] xl:grid-cols-[minmax(0,19rem)_1fr] lg:gap-10">
          {sidebar}
          <div className="min-w-0 space-y-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
