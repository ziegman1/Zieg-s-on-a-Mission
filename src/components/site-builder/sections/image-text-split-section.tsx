import Link from "next/link";
import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";

export function ImageTextSplitSection({
  section,
  index,
}: {
  section: PageSection;
  index: number;
}) {
  const c = section.content;
  const title = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const ctaLabel = contentStr(c, "ctaLabel");
  const ctaUrl = contentStr(c, "ctaUrl") || "#";
  const imgUrl = contentStr(c, "imageUrl").trim();

  if (!title.trim() && !body.trim()) return null;

  const isTextLeft = index % 2 === 0;
  const sectionBg = index % 2 === 0 ? "bg-white" : "bg-neutral-50";

  const textColumn = (
    <div className="col-span-2 md:col-span-1 border-l-2 border-blue-200/80 pl-4">
      <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{title}</h2>
      <p className="mt-3 text-brand-ink/85 leading-relaxed whitespace-pre-wrap">{body}</p>
      {ctaLabel.trim() ? (
        <Link href={ctaUrl} className="text-blue-600 hover:underline mt-4 inline-block font-medium">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  const visualColumn = imgUrl ? (
    <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-end">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgUrl}
        alt={contentStr(c, "imageAlt")}
        className="max-h-64 w-full max-w-md rounded-lg object-cover shadow-sm border border-gray-200/80"
      />
    </div>
  ) : (
    <div className="hidden md:block md:col-span-1 min-h-[5rem]" aria-hidden />
  );

  return (
    <section className={sectionBg}>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {isTextLeft ? (
            <>
              {textColumn}
              {visualColumn}
            </>
          ) : (
            <>
              {visualColumn}
              {textColumn}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
