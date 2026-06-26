"use client";

import { useEffect, useState } from "react";
import type { LinkPreviewMetadata } from "@/lib/community/link-preview";
import { cn } from "@/lib/utils";

function LinkPreviewSkeleton() {
  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border border-black/[0.06] bg-brand-surface/30 animate-pulse"
      aria-hidden
    >
      <div className="h-36 bg-black/[0.04]" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-2.5 w-24 rounded bg-black/[0.06]" />
        <div className="h-3.5 w-[80%] rounded bg-black/[0.06]" />
        <div className="h-3 w-full rounded bg-black/[0.05]" />
      </div>
    </div>
  );
}

export function CommunityLinkPreviewCard({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [preview, setPreview] = useState<LinkPreviewMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadPreview() {
      setLoading(true);
      setPreview(null);

      try {
        const response = await fetch(
          `/api/community/link-preview?url=${encodeURIComponent(url)}`,
          { signal: controller.signal },
        );

        if (!response.ok) return;

        const data = (await response.json()) as { preview?: LinkPreviewMetadata | null };
        if (!cancelled && data.preview) {
          setPreview(data.preview);
        }
      } catch {
        // Ignore preview failures; the original linked text still renders.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  if (loading) {
    return <LinkPreviewSkeleton />;
  }

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-3 block overflow-hidden rounded-xl border border-black/[0.06] bg-brand-surface/30",
        "transition-colors hover:bg-brand-surface/50",
        className,
      )}
    >
      {preview.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.imageUrl}
          alt=""
          className="h-40 w-full object-cover border-b border-black/[0.05] bg-black/[0.03]"
          loading="lazy"
        />
      ) : null}
      <div className="space-y-1 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
          {preview.hostname}
        </p>
        {preview.title ? (
          <p className="text-sm font-semibold text-brand-ink leading-snug line-clamp-2">
            {preview.title}
          </p>
        ) : null}
        {preview.description ? (
          <p className="text-xs text-brand-ink/60 leading-relaxed line-clamp-3">
            {preview.description}
          </p>
        ) : null}
      </div>
    </a>
  );
}
