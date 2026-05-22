"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BuilderSelection } from "@/lib/site-builder/element-types";

export type BuilderPreviewContextValue = {
  editMode: boolean;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  onSelectSection: (sectionId: string) => void;
  onSelectElement: (sectionId: string, elementId: string) => void;
  selection: BuilderSelection | null;
};

const BuilderPreviewContext = createContext<BuilderPreviewContextValue | null>(null);

export function BuilderPreviewProvider({
  value,
  children,
}: {
  value: BuilderPreviewContextValue;
  children: ReactNode;
}) {
  return (
    <BuilderPreviewContext.Provider value={value}>{children}</BuilderPreviewContext.Provider>
  );
}

export function useBuilderPreview() {
  return useContext(BuilderPreviewContext);
}
