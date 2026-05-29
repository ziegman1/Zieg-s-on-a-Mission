import { BUILDER_PAGES } from "@/lib/site-builder/types";
import { cn } from "@/lib/utils";

export type BuilderNavItem =
  | { type: "group"; label: string }
  | { type: "page"; pageKey: string; label: string; indent?: boolean };

/** Flat nav list with optional group headers (e.g. Get Involved). */
export function builderPagesNavItems(): BuilderNavItem[] {
  const items: BuilderNavItem[] = [];
  let lastGroup: string | undefined;

  for (const page of BUILDER_PAGES) {
    const group = "group" in page ? page.group : undefined;
    if (group && group !== lastGroup) {
      items.push({ type: "group", label: group });
      lastGroup = group;
    }
    if (!group) {
      lastGroup = undefined;
    }
    items.push({
      type: "page",
      pageKey: page.pageKey,
      label: page.label,
      indent: Boolean(group),
    });
  }

  return items;
}

export function BuilderPagesNav({
  activePage,
  onSelect,
  className,
}: {
  activePage: string;
  onSelect: (pageKey: string) => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex-1 overflow-y-auto px-2 pb-2 space-y-0.5", className)}>
      {builderPagesNavItems().map((item) =>
        item.type === "group" ? (
          <p
            key={`group-${item.label}`}
            className="px-2.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-primary/80 first:pt-1"
          >
            {item.label}
          </p>
        ) : (
          <button
            key={item.pageKey}
            type="button"
            onClick={() => onSelect(item.pageKey)}
            className={cn(
              "w-full text-left rounded-md py-2 text-sm transition-colors",
              item.indent ? "pl-5 pr-2.5" : "px-2.5",
              activePage === item.pageKey
                ? "bg-brand-primary/20 text-brand-primary"
                : "text-zinc-400 hover:bg-zinc-900",
            )}
          >
            {item.label}
          </button>
        ),
      )}
    </nav>
  );
}
