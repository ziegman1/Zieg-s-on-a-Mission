"use client";

import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { useBuilderPreview } from "./builder-preview-context";
import { elementStyleProps, isElementVisible } from "@/lib/site-builder/element-style-utils";
import type { ElementStyle } from "@/lib/site-builder/element-types";
import { cn } from "@/lib/utils";
import "./builder-preview.css";

export type EditableLayout = "inline" | "block" | "fill" | "absolute";

export function EditableElement({
  sectionId,
  elementId,
  style,
  visible = true,
  className,
  layout = "block",
  styleOnWrapper = true,
  children,
  onClickCapture,
}: {
  sectionId: string;
  elementId: string;
  style?: ElementStyle;
  visible?: boolean;
  className?: string;
  /** How the edit wrapper participates in layout (default: block). Use inline for CTAs in flex rows. */
  layout?: EditableLayout;
  /** When false, visual styles apply only to children (avoids full-width button chrome). */
  styleOnWrapper?: boolean;
  children: ReactNode;
  onClickCapture?: () => void;
}) {
  const ctx = useBuilderPreview();
  const mergedStyle = style;
  const show = isElementVisible(mergedStyle, visible);
  const { className: styleCls, style: inline } = elementStyleProps(
    styleOnWrapper ? mergedStyle : undefined,
  );

  const layoutClass =
    layout === "inline"
      ? "builder-el--inline"
      : layout === "fill"
        ? "builder-el--fill"
        : layout === "absolute"
          ? "builder-el--absolute"
          : "builder-el--block";

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

  const select = () => {
    ctx.onSelectElement(sectionId, elementId);
    onClickCapture?.();
  };

  const interactionProps = {
    role: "button" as const,
    tabIndex: 0,
    "data-builder-element": elementId,
    "data-builder-section": sectionId,
    "data-builder-selected": selected ? "" : undefined,
    onPointerDown: (e: PointerEvent) => {
      e.stopPropagation();
      select();
    },
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter") select();
    },
  };

  if (!show) {
    return (
      <div
        {...interactionProps}
        className={cn(
          layoutClass,
          "rounded-md border border-dashed border-zinc-400/80 bg-zinc-100/50 opacity-50 min-h-[2rem] flex items-center justify-center text-[10px] text-zinc-500 uppercase tracking-wide",
          className,
        )}
      >
        Hidden
      </div>
    );
  }

  return (
    <div
      {...interactionProps}
      className={cn(layoutClass, className, !styleOnWrapper ? undefined : styleCls)}
      style={styleOnWrapper ? inline : undefined}
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
      data-builder-section-selected={selected ? "" : undefined}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-builder-element]")) return;
        e.stopPropagation();
        ctx.onSelectSection(sectionId);
      }}
      className={cn("relative", !visible && "opacity-40", className)}
    >
      {selected ? <span className="builder-section-label">{label}</span> : null}
      {children}
    </div>
  );
}
