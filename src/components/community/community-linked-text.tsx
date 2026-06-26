import type { MouseEvent, ReactNode } from "react";
import { splitTextIntoLinkSegments } from "@/lib/community/post-urls";
import { cn } from "@/lib/utils";

const DEFAULT_LINK_CLASS =
  "text-brand-primary hover:underline break-all underline-offset-2";

export function CommunityLinkedText({
  text,
  className,
  linkClassName,
  onLinkClick,
}: {
  text: string;
  className?: string;
  linkClassName?: string;
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const segments = splitTextIntoLinkSegments(text);

  const content: ReactNode = segments.map((segment, index) => {
    if (segment.kind === "url") {
      return (
        <a
          key={`url-${index}`}
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(DEFAULT_LINK_CLASS, linkClassName)}
          onClick={onLinkClick}
        >
          {segment.display}
        </a>
      );
    }

    return <span key={`text-${index}`}>{segment.value}</span>;
  });

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return content;
}
