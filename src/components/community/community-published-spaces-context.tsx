"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CommunitySpace } from "@/lib/community/types";

const CommunityPublishedSpacesContext = createContext<CommunitySpace[] | null>(null);

export function CommunityPublishedSpacesProvider({
  initialSpaces,
  children,
}: {
  initialSpaces: CommunitySpace[];
  children: ReactNode;
}) {
  const [spaces, setSpaces] = useState(initialSpaces);

  useEffect(() => {
    setSpaces(initialSpaces);
  }, [initialSpaces]);

  return (
    <CommunityPublishedSpacesContext.Provider value={spaces}>
      {children}
    </CommunityPublishedSpacesContext.Provider>
  );
}

export function useCommunityPublishedSpaces(fallback: CommunitySpace[]): CommunitySpace[] {
  const contextSpaces = useContext(CommunityPublishedSpacesContext);
  return contextSpaces ?? fallback;
}
