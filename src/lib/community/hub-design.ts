/** Shared Mission Hub app UI tokens (spacing, radii, motion). */

export const MH = {
  bg: "bg-[#ebe8e4]",
  bgElevated: "bg-white/92",
  /** Flat feed post surface — minimal shadow, no ring */
  card: "rounded-xl bg-white/80",
  cardFlat: "rounded-xl bg-white/75",
  topbarH: "h-14",
  stickyToolbarTop: "top-14",
  bottomNavH: "pb-[calc(4.25rem+env(safe-area-inset-bottom))]",
  /** Primary feed column (~800px) */
  feedMax: "max-w-[52rem]",
  transition: "transition-colors duration-200 ease-out",
  transitionFast: "transition-all duration-150 ease-out",
} as const;
