"use client";

import { useEffect, useState } from "react";

/** Bottom inset (px) when the on-screen keyboard is open — for sheets/composers. */
export function useVisualViewportKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!active || typeof window === "undefined") {
      setInset(0);
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      if (!window.visualViewport) return;
      const v = window.visualViewport;
      const keyboard = Math.max(0, window.innerHeight - v.height - v.offsetTop);
      setInset(Math.round(keyboard));
    }

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);

  return inset;
}
