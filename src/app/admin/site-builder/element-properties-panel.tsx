"use client";

import { useState } from "react";
import type { BuilderSelection } from "@/lib/site-builder/element-types";
import type { ElementStyle } from "@/lib/site-builder/element-types";
import type { PageSection } from "@/lib/site-builder/types";
import {
  addCardToSection,
  addContentElementToSection,
  clearElementStyle,
  deleteSectionElement,
  duplicateSectionElement,
  EDITABLE_SECTION_TYPES,
  getContentElements,
  patchFieldStyle,
  reorderCards,
  reorderContentElements,
  restoreElementFromDefaults,
  updateSectionElement,
  findListItemByElementId,
} from "@/lib/site-builder/section-elements";
import { contentStr, getFieldStyle, sortedListItems } from "@/lib/site-builder/content-utils";
import { AdminImageUrlField } from "../site-copy/admin-image-url-field";
import { SiteBuilderTextField } from "@/components/admin/site-builder-text-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Collapse({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-800 rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 bg-zinc-900/80"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="p-3 space-y-3">{children}</div> : null}
    </div>
  );
}

function StyleControls({
  style,
  onPatch,
  showLayout = true,
  showButton = false,
  onResetStyle,
}: {
  style: ElementStyle;
  onPatch: (p: Partial<ElementStyle>) => void;
  showLayout?: boolean;
  showButton?: boolean;
  onResetStyle?: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-zinc-500">Background</Label>
          <Input
            type="color"
            className="h-9 p-1"
            value={style.backgroundColor ?? "#ffffff"}
            onChange={(e) => onPatch({ backgroundColor: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-[10px] text-zinc-500">Text color</Label>
          <Input
            type="color"
            className="h-9 p-1"
            value={style.textColor ?? "#1a1a1a"}
            onChange={(e) => onPatch({ textColor: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label className="text-[10px] text-zinc-500">Border color</Label>
        <Input
          type="color"
          className="h-9 p-1"
          value={style.borderColor ?? "#cccccc"}
          onChange={(e) => onPatch({ borderColor: e.target.value })}
        />
      </div>
      <SelectField
        label="Border radius"
        value={style.borderRadius ?? ""}
        options={[
          ["", "Default"],
          ["none", "None"],
          ["sm", "Small"],
          ["md", "Medium"],
          ["lg", "Large"],
          ["xl", "XL"],
          ["full", "Full"],
        ]}
        onChange={(v) => onPatch({ borderRadius: (v || undefined) as ElementStyle["borderRadius"] })}
      />
      <SelectField
        label="Shadow"
        value={style.shadow ?? ""}
        options={[
          ["", "Default"],
          ["none", "None"],
          ["sm", "Small"],
          ["md", "Medium"],
          ["lg", "Large"],
        ]}
        onChange={(v) => onPatch({ shadow: (v || undefined) as ElementStyle["shadow"] })}
      />
      <SelectField
        label="Padding"
        value={style.padding ?? ""}
        options={[
          ["", "Default"],
          ["none", "None"],
          ["sm", "Small"],
          ["md", "Medium"],
          ["lg", "Large"],
          ["xl", "XL"],
        ]}
        onChange={(v) => onPatch({ padding: (v || undefined) as ElementStyle["padding"] })}
      />
      {showLayout ? (
        <>
          <SelectField
            label="Alignment"
            value={style.alignment ?? ""}
            options={[
              ["", "Default"],
              ["left", "Left"],
              ["center", "Center"],
              ["right", "Right"],
            ]}
            onChange={(v) => onPatch({ alignment: (v || undefined) as ElementStyle["alignment"] })}
          />
          <SelectField
            label="Column span"
            value={style.columnSpan ? String(style.columnSpan) : ""}
            options={[
              ["", "Auto"],
              ["1", "1 col"],
              ["2", "2 cols"],
              ["3", "3 cols"],
            ]}
            onChange={(v) =>
              onPatch({ columnSpan: v ? (Number(v) as 1 | 2 | 3) : undefined })
            }
          />
          <SelectField
            label="Max width"
            value={style.maxWidth ?? ""}
            options={[
              ["", "Default"],
              ["narrow", "Narrow"],
              ["normal", "Normal"],
              ["wide", "Wide"],
              ["full", "Full"],
            ]}
            onChange={(v) => onPatch({ maxWidth: (v || undefined) as ElementStyle["maxWidth"] })}
          />
        </>
      ) : null}
      <SelectField
        label="Font size"
        value={style.fontSize ?? ""}
        options={[
          ["", "Default"],
          ["xs", "XS"],
          ["sm", "SM"],
          ["base", "Base"],
          ["lg", "LG"],
          ["xl", "XL"],
          ["2xl", "2XL"],
          ["3xl", "3XL"],
        ]}
        onChange={(v) => onPatch({ fontSize: (v || undefined) as ElementStyle["fontSize"] })}
      />
      <SelectField
        label="Font weight"
        value={style.fontWeight ?? ""}
        options={[
          ["", "Default"],
          ["normal", "Normal"],
          ["medium", "Medium"],
          ["semibold", "Semibold"],
          ["bold", "Bold"],
        ]}
        onChange={(v) => onPatch({ fontWeight: (v || undefined) as ElementStyle["fontWeight"] })}
      />
      <SelectField
        label="Heading level"
        value={style.headingLevel ?? ""}
        options={[
          ["", "Auto"],
          ["h1", "H1"],
          ["h2", "H2"],
          ["h3", "H3"],
          ["h4", "H4"],
          ["p", "Paragraph"],
        ]}
        onChange={(v) => onPatch({ headingLevel: (v || undefined) as ElementStyle["headingLevel"] })}
      />
      {showButton ? (
        <>
          <SelectField
            label="Button style"
            value={style.buttonVariant ?? ""}
            options={[
              ["", "Default"],
              ["default", "Filled"],
              ["outline", "Outline"],
              ["ghost", "Ghost"],
              ["accent", "Accent"],
            ]}
            onChange={(v) =>
              onPatch({ buttonVariant: (v || undefined) as ElementStyle["buttonVariant"] })
            }
          />
          <SelectField
            label="Button size"
            value={style.buttonSize ?? ""}
            options={[
              ["", "Default"],
              ["sm", "Small"],
              ["md", "Medium"],
              ["lg", "Large"],
            ]}
            onChange={(v) => onPatch({ buttonSize: (v || undefined) as ElementStyle["buttonSize"] })}
          />
        </>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={() => onResetStyle?.()}
      >
        Reset style
      </Button>
    </>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] text-zinc-500">{label}</Label>
      <select
        className="mt-0.5 w-full h-9 rounded-md border border-zinc-700 bg-zinc-950 text-sm px-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v || "default"} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ElementPropertiesPanel({
  pageKey,
  section,
  selection,
  onChange,
  onDeleted,
}: {
  pageKey: string;
  section: PageSection;
  selection: BuilderSelection;
  onChange: (updater: (prev: PageSection) => PageSection) => void;
  onDeleted?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { elementId, elementType, label } = selection;
  const c = section.content;

  const applySection = (updater: (prev: PageSection) => PageSection) => onChange(updater);

  function patchStyle(p: Partial<ElementStyle>) {
    if (elementId.startsWith("card:") || elementId.startsWith("bullet:") || elementId.startsWith("el:")) {
      applySection((s) => updateSectionElement(s, elementId, { stylePatch: p }));
    } else {
      applySection((s) => patchFieldStyle(s, elementId, p));
    }
  }

  const style =
    elementId.startsWith("card:") || elementId.startsWith("el:")
      ? (() => {
          if (elementId.startsWith("card:")) {
            const card = sortedListItems(c.cards, { includeHidden: true }).find(
              (x) => `card:${x.id}` === elementId,
            );
            return card?.style ?? {};
          }
          const el = getContentElements(c).find((e) => `el:${e.id}` === elementId);
          return el?.style ?? {};
        })()
      : getFieldStyle(c, elementId) ?? {};

  const contentGroup = renderContent();
  const isImage = elementType === "image";
  const isButton = elementType === "button";
  const isCard = elementType === "card";

  return (
    <div className="space-y-3 p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="text-[11px] text-zinc-500 font-mono">{elementId}</p>

      <Collapse title="Content">{contentGroup}</Collapse>
      {!isImage ? (
        <Collapse title="Layout" defaultOpen={false}>
          <SelectField
            label="Spacing"
            value={style.spacing ?? ""}
            options={[
              ["", "Default"],
              ["tight", "Tight"],
              ["normal", "Normal"],
              ["loose", "Loose"],
            ]}
            onChange={(v) => patchStyle({ spacing: (v || undefined) as ElementStyle["spacing"] })}
          />
          {isImage ? (
            <SelectField
              label="Object fit"
              value={style.objectFit ?? ""}
              options={[
                ["", "Default"],
                ["cover", "Cover"],
                ["contain", "Contain"],
              ]}
              onChange={(v) => patchStyle({ objectFit: (v || undefined) as ElementStyle["objectFit"] })}
            />
          ) : null}
        </Collapse>
      ) : (
        <Collapse title="Layout" defaultOpen={false}>
          <SelectField
            label="Object fit"
            value={style.objectFit ?? "cover"}
            options={[
              ["cover", "Cover"],
              ["contain", "Contain"],
            ]}
            onChange={(v) => patchStyle({ objectFit: v as ElementStyle["objectFit"] })}
          />
          <SelectField
            label="Image position"
            value={style.imagePosition ?? ""}
            options={[
              ["", "Default"],
              ["left", "Left"],
              ["right", "Right"],
              ["top", "Top"],
              ["bottom", "Bottom"],
            ]}
            onChange={(v) =>
              patchStyle({ imagePosition: (v || undefined) as ElementStyle["imagePosition"] })
            }
          />
        </Collapse>
      )}

      <Collapse title="Style" defaultOpen={false}>
        <StyleControls
          style={style}
          onPatch={patchStyle}
          showButton={isButton}
          showLayout={isCard}
          onResetStyle={() => applySection((s) => clearElementStyle(s, elementId))}
        />
      </Collapse>

      <Collapse title="Actions" defaultOpen>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applySection((s) => toggleElementVisible(s, elementId))}
          >
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            Toggle visibility
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applySection((s) => duplicateSectionElement(s, elementId))}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Duplicate
          </Button>
        </div>
        {isCard ? (
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const id = elementId.slice(5);
                applySection((s) => reorderCards(s, id, -1));
              }}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const id = elementId.slice(5);
                applySection((s) => reorderCards(s, id, 1));
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {elementId.startsWith("el:") ? (
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applySection((s) => reorderContentElements(s, elementId, -1))}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applySection((s) => reorderContentElements(s, elementId, 1))}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full mt-2 text-xs"
          onClick={() => applySection((s) => restoreElementFromDefaults(pageKey, s, elementId))}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Restore element default
        </Button>
        {confirmDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              applySection((s) => deleteSectionElement(s, elementId));
              setConfirmDelete(false);
              onDeleted?.();
            }}
          >
            Confirm delete
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-red-400"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete element
          </Button>
        )}
      </Collapse>

      {EDITABLE_SECTION_TYPES.includes(section.sectionType) ? (
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <p className="text-[10px] uppercase text-zinc-500">Add to section</p>
          <select
            className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-950 text-sm px-2"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              e.target.value = "";
              if (v === "card") applySection((s) => addCardToSection(s));
              else
                applySection((s) =>
                  addContentElementToSection(s, v as "heading" | "paragraph" | "quote" | "note"),
                );
            }}
          >
            <option value="">Add element…</option>
            {section.sectionType === "card_grid" ? <option value="card">New card</option> : null}
            <option value="heading">Text — Heading</option>
            <option value="paragraph">Text — Paragraph</option>
            <option value="quote">Text — Quote</option>
            <option value="note">Text — Note</option>
          </select>
        </div>
      ) : null}
    </div>
  );

  function renderContent() {
    if (elementType === "card") {
      const card = sortedListItems(c.cards, { includeHidden: true }).find((x) => `card:${x.id}` === elementId);
      if (!card) return <p className="text-xs text-zinc-500">Card not found</p>;
      return (
        <>
          <Field
            label="Title"
            fieldKey="headline"
            value={card.text}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
          />
          <Field
            label="Subtitle / amount"
            fieldKey="amountLabel"
            value={String(card.metadata?.amountLabel ?? "")}
            onChange={(v) =>
              applySection((s) => updateSectionElement(s, elementId, { metadata: { amountLabel: v } }))
            }
          />
          <Field
            label="Body"
            fieldKey="body"
            value={String(card.metadata?.body ?? "")}
            multiline
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { metadata: { body: v } }))}
          />
          <Field
            label="Footnote"
            fieldKey="giftNote"
            value={String(card.metadata?.giftNote ?? "")}
            multiline
            onChange={(v) =>
              applySection((s) => updateSectionElement(s, elementId, { metadata: { giftNote: v } }))
            }
          />
          <Field
            label="Button label"
            fieldKey="cta"
            value={String(card.metadata?.cta ?? "")}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { metadata: { cta: v } }))}
          />
          <Field
            label="Button URL"
            fieldKey="href"
            value={String(card.metadata?.href ?? "")}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { metadata: { href: v } }))}
          />
        </>
      );
    }

    if (elementType === "button") {
      const slot = elementId.slice(4);
      const labelKey =
        slot === "primary" ? "primaryCtaLabel" : slot === "secondary" ? "secondaryCtaLabel" : "tertiaryCtaLabel";
      const urlKey =
        slot === "primary" ? "primaryCtaUrl" : slot === "secondary" ? "secondaryCtaUrl" : "tertiaryCtaUrl";
      return (
        <>
          <Field
            label="Label"
            fieldKey={labelKey}
            value={contentStr(c, labelKey)}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
          />
          <Field
            label="URL"
            fieldKey={urlKey}
            value={contentStr(c, urlKey)}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { metadata: { url: v } }))}
          />
        </>
      );
    }

    if (elementType === "image") {
      return (
        <>
          <AdminImageUrlField
            label="Image URL"
            value={contentStr(c, "imageUrl")}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
          />
          <Field
            label="Alt text"
            fieldKey="imageAlt"
            value={contentStr(c, "imageAlt")}
            onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { metadata: { alt: v } }))}
          />
        </>
      );
    }

    if (elementType === "custom") {
      const el = getContentElements(c).find((e) => `el:${e.id}` === elementId);
      if (!el) return null;
      return (
        <Field
          label="Text"
          fieldKey="body"
          contentElementType={el.type}
          value={el.text}
          multiline={el.type !== "heading"}
          onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
        />
      );
    }

    if (elementType === "list_item") {
      const item = findListItemByElementId(c, elementId);
      if (!item) return null;
      return (
        <Field
          label="Line text"
          fieldKey="bullet"
          value={item.text}
          onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
        />
      );
    }

    const textKey =
      elementId === "quote:text" ? "quote" : elementId === "quote:attribution" ? "attribution" : elementId;
    return (
      <Field
        label="Text"
        fieldKey={textKey}
        value={contentStr(c, textKey)}
        multiline={["body", "intro", "quote"].includes(textKey)}
        onChange={(v) => applySection((s) => updateSectionElement(s, elementId, { text: v }))}
      />
    );
  }
}

function Field({
  label,
  fieldKey,
  value,
  onChange,
  multiline,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  contentElementType?: string;
}) {
  return (
    <SiteBuilderTextField
      fieldKey={fieldKey}
      label={label}
      value={value}
      onChange={onChange}
      multiline={multiline}
      compact
    />
  );
}

function toggleElementVisible(section: PageSection, elementId: string): PageSection {
  if (elementId.startsWith("card:")) {
    const card = sortedListItems(section.content.cards, { includeHidden: true }).find(
      (x) => `card:${x.id}` === elementId,
    );
    if (!card) return section;
    return updateSectionElement(section, elementId, { visible: !card.visible });
  }
  const listItem = findListItemByElementId(section.content, elementId);
  if (
    listItem &&
    (elementId.startsWith("bullet:") ||
      elementId.startsWith("topic:") ||
      elementId.startsWith("item:"))
  ) {
    return updateSectionElement(section, elementId, { visible: !listItem.visible });
  }
  if (elementId.startsWith("el:")) {
    const el = getContentElements(section.content).find((e) => `el:${e.id}` === elementId);
    if (!el) return section;
    return updateSectionElement(section, elementId, { visible: !el.visible });
  }
  const cur = getFieldStyle(section.content, elementId);
  return patchFieldStyle(section, elementId, {
    visible: cur?.visible === false ? true : false,
  });
}
