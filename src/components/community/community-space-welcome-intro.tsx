"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import {
  getWelcomeIntroPreview,
  parseWelcomeParagraphs,
  splitWelcomeHeadingAndBody,
} from "@/lib/community/spiritual-room";
import { cn } from "@/lib/utils";

export function CommunitySpaceWelcomeIntro({ space }: { space: CommunitySpaceDetail }) {
  const { experience } = space;
  const [expanded, setExpanded] = useState(false);

  if (!experience.showWelcomeMessage || !experience.welcomeMessage?.trim()) {
    return null;
  }

  const paragraphs = parseWelcomeParagraphs(experience.welcomeMessage);
  const { heading, body } = splitWelcomeHeadingAndBody(paragraphs);
  const { preview, hasMore } = getWelcomeIntroPreview(body);
  const showExpand = hasMore || body.length > preview.length;
  const hiddenParagraphs = body.slice(preview.length);

  return (
    <section
      aria-label="Welcome to this space"
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-white/96",
        "shadow-[0_2px_20px_rgba(30,54,68,0.06)]",
        "ring-1 ring-black/[0.05]",
      )}
    >
      <div className="px-4 sm:px-6 py-4 sm:py-5">
        {heading ? (
          <h2 className="font-serif text-lg sm:text-xl text-brand-ink/90 tracking-wide leading-snug">
            {heading}
          </h2>
        ) : null}
        <div
          className={cn(
            "space-y-3.5 text-[15px] sm:text-[15.5px] leading-[1.72] text-brand-ink/75",
            heading ? "mt-3" : "",
          )}
        >
          {preview.map((para, i) => (
            <p key={`preview-${i}`} className="whitespace-pre-wrap">
              {para}
            </p>
          ))}
          {hiddenParagraphs.length > 0 ? (
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="space-y-3.5">
                  {hiddenParagraphs.map((para, i) => (
                    <p key={`more-${i}`} className="whitespace-pre-wrap">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {showExpand ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 text-sm font-medium",
              "text-brand-primary/90 hover:text-brand-primary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-md px-1 -ml-1",
            )}
          >
            {expanded ? "Show less" : "Read full welcome"}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300 ease-out",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : null}
        {experience.engagementPrompt ? (
          <p className="mt-5 pt-4 border-t border-brand-primary/8 text-sm text-brand-ink/55 italic font-light">
            {experience.engagementPrompt}
          </p>
        ) : null}
      </div>
    </section>
  );
}
