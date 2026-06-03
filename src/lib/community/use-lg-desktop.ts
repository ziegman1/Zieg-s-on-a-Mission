"use client";

import { useEffect, useState } from "react";

const LG_DESKTOP_MQ = "(min-width: 1024px)";

/** True when viewport is Tailwind `lg` and up — matches lg:hidden / hidden lg:flex split. */
export function useLgDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_DESKTOP_MQ);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
