"use client";

import type { ReactNode } from "react";
import { useBuilderPreview } from "./builder-preview-context";
import { elementStyleProps, isElementVisible } from "@/lib/site-builder/element-style-utils";
import type { ElementStyle } from "@/lib/site-builder/element-types";
import { cn } from "@/lib/utils";

export function EditableElement({
  sectionId,
  elementId,
  style,
  visible = true,
  className,
  children,
  onClickCapture,
}: {
  sectionId: string;
  elementId: string;
  style?: ElementStyle;
  visible?: boolean;
  className?: string;
  children: ReactNode;
  onClickCapture?: () => void;
}) {
  const ctx = useBuilderPreview();
  const mergedStyle = style;
  const show = isElementVisible(mergedStyle, visible);
  const { className: styleCls, style: inline } = elementStyleProps(mergedStyle);

  if (!ctx?.editMode) {
    if (!show) return null;
    return (
      <div className={cn(className, styleCls)} style={inline}>
        {children}
      </div>
    );
  }

  const selected =
    ctx.selectedSectionId === sectionId && ctx.selectedElementId === elementId;
  const sectionSelected = ctx.selectedSectionId === sectionId && !ctx.selectedElementId;

  if (!show) {
    return (
      <div
        role="button"
        tabIndex={0}
        data-builder-element={elementId}
        data-builder-section={sectionId}
        onClick={(e) => {
          e.stopPropagation();
          ctx.onSelectElement(sectionId, elementId);
          onClickCapture?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") ctx.onSelectElement(sectionId, elementId);
        }}
        className={cn(
          "relative rounded-md border border-dashed border-zinc-400/80 bg-zinc-100/50 opacity-50 min-h-[2rem] flex items-center justify-center text-[10px] text-zinc-500 uppercase tracking-wide",
          selected && "ring-2 ring-brand-primary ring-offset-2",
          className,
        )}
      >
        Hidden
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-builder-element={elementId}
      data-builder-section={sectionId}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onSelectElement(sectionId, elementId);
        onClickCapture?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") ctx.onSelectElement(sectionId, elementId);
      }}
      className={cn(
        "relative rounded-sm transition-shadow",
        selected
          ? "ring-2 ring-brand-primary ring-offset-2 z-[1]"
          : "hover:ring-1 hover:ring-brand-primary/50",
        sectionSelected && !selected && "outline outline-1 outline-brand-primary/20",
        styleCls,
        className,
      )}
      style={inline}
    >
      {children}
    </div>
  );
}

export function EditableSectionShell({
  sectionId,
  visible,
  label,
  children,
  className,
}: {
  sectionId: string;
  visible: boolean;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useBuilderPreview();
  if (!ctx?.editMode) {
    if (!visible) return null;
    return <div className={className}>{children}</div>;
  }

  const selected =
    ctx.selectedSectionId === sectionId && !ctx.selectedElementId;

  return (
    <div
      role="button"
      tabIndex={0}
      data-builder-section={sectionId}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onSelectSection(sectionId);
      }}
      className={cn(
        "relative",
        !visible && "opacity-40",
        selected && "ring-2 ring-violet-500/80 ring-offset-4 rounded-lg",
        !selected && "hover:ring-1 hover:ring-violet-400/40 rounded-lg",
        className,
      )}
    >
      {selected ? (
        <span className="absolute -top-3 left-2 z-10 text-[10px] font-medium uppercase tracking-wide bg-violet-600 text-white px-2 py-0.5 rounded">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}
