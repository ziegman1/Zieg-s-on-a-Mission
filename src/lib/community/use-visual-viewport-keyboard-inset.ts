"use client";

import { useEffect } from "react";

const CSS_VAR = "--mh-keyboard-inset";

/** Exposes keyboard overlap as a CSS variable for sticky composers. */
export function useVisualViewportKeyboardInset(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty(CSS_VAR, `${Math.round(inset)}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.setProperty(CSS_VAR, "0px");
    };
  }, [active]);
}
