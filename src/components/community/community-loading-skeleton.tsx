import { cn } from "@/lib/utils";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-black/[0.05] via-black/[0.08] to-black/[0.05]",
        "bg-[length:200%_100%] animate-[mh-shimmer_1.2s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function CommunityFeedLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="rounded-2xl bg-white/70 ring-1 ring-black/[0.04] px-4 py-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <ShimmerBar className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <ShimmerBar className="h-3.5 w-32" />
              <ShimmerBar className="h-3 w-24" />
            </div>
          </div>
          <ShimmerBar className="h-4 w-full" />
          <ShimmerBar className="h-4 w-[88%]" />
          <div className="flex gap-2 pt-1">
            <ShimmerBar className="h-8 w-16 rounded-full" />
            <ShimmerBar className="h-8 w-20 rounded-full" />
            <ShimmerBar className="h-8 w-24 rounded-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CommunitySpaceLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <ShimmerBar className="h-8 w-48 rounded-lg" />
      <ShimmerBar className="h-4 w-full max-w-md" />
      <CommunityFeedLoadingSkeleton count={2} />
    </div>
  );
}

export function CommunitySettingsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200 max-w-xl">
      <ShimmerBar className="h-7 w-40 rounded-lg" />
      <ShimmerBar className="h-4 w-56" />
      <div className="rounded-2xl bg-white/70 ring-1 ring-black/[0.04] p-5 space-y-4">
        <ShimmerBar className="h-4 w-24" />
        <ShimmerBar className="h-10 w-full rounded-lg" />
        <ShimmerBar className="h-10 w-full rounded-lg" />
        <ShimmerBar className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}
