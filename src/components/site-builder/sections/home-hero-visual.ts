import type { ElementStyle } from "@/lib/site-builder/element-types";
import { buttonClassesFromStyle } from "@/lib/site-builder/element-style-utils";
import { STOREFRONT_BUTTON_PRIMARY } from "@/lib/storefront/storefront-button-styles";

/** Left-to-right scrim — darkest behind copy, fades before faces on the right. */
export const HOME_HERO_OVERLAY =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(20,30,40,0.78)_0%,rgba(20,30,40,0.62)_24%,rgba(20,30,40,0.48)_40%,rgba(20,30,40,0.2)_56%,rgba(20,30,40,0)_72%)] sm:bg-[linear-gradient(90deg,rgba(20,30,40,0.68)_0%,rgba(20,30,40,0.52)_28%,rgba(20,30,40,0.2)_52%,rgba(20,30,40,0)_72%)]";

export const HOME_HERO_IMAGE =
  "w-full h-full object-cover object-[center_28%] sm:object-[center_22%] md:object-center brightness-[0.82]";

export const HOME_HERO_TEXT_SHADOW = "[text-shadow:0_2px_10px_rgba(0,0,0,0.18)]";

export const HOME_HERO_HEADLINE =
  `text-[#F5F1EA] ${HOME_HERO_TEXT_SHADOW}`;

export const HOME_HERO_SUBHEADLINE =
  `mt-3 sm:mt-4 max-w-[620px] text-[1.15rem] sm:text-xl md:text-[1.35rem] font-medium leading-[1.35] text-[#F5F1EA] ${HOME_HERO_TEXT_SHADOW}`;

export const HOME_HERO_BODY =
  `mt-6 max-w-[620px] text-[1.1rem] leading-[1.75] text-[#F5F1EA] ${HOME_HERO_TEXT_SHADOW}`;

export const HOME_HERO_BODY_WITH_SUBHEADLINE =
  `mt-4 sm:mt-5 max-w-[620px] text-[1.1rem] leading-[1.75] text-[#F5F1EA] ${HOME_HERO_TEXT_SHADOW}`;

export const HOME_HERO_EYEBROW = "text-[#F5F1EA]/90";

export const HOME_HERO_CONTENT =
  "max-w-[min(100%,calc(36rem-75px))] text-left max-md:-translate-y-0 md:-translate-y-[50px]";

export function homeHeroButtonClasses(
  slot: "primary" | "secondary" | "tertiary",
  style?: ElementStyle,
): string {
  if (style?.buttonVariant || style?.buttonSize) {
    return buttonClassesFromStyle(style);
  }
  const base = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  switch (slot) {
    case "primary":
      return STOREFRONT_BUTTON_PRIMARY;
    case "secondary":
      return `${base} h-12 px-7 border border-[#F5F1EA]/45 text-[#F5F1EA] bg-white/10 hover:bg-white/18 backdrop-blur-[2px]`;
    case "tertiary":
      return `${base} h-12 px-5 text-[#F5F1EA]/88 hover:bg-white/10 hover:text-[#F5F1EA]`;
  }
}
