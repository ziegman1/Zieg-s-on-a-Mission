"use client";

import type { SectionFieldDef } from "@/lib/site-builder/registry";
import { registryFor } from "@/lib/site-builder/registry";
import { contentStr, newListItem, visibleListItems } from "@/lib/site-builder/content-utils";
import { patchSectionContent } from "@/lib/site-builder/patch-section";
import type { ListItem, PageSection, SectionType } from "@/lib/site-builder/types";
import { AdminImageUrlField } from "../site-copy/admin-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";

export function SectionPropertiesPanel({
  section,
  onChange,
  onRestoreSection,
}: {
  section: PageSection | null;
  onChange: (next: PageSection) => void;
  onRestoreSection: () => void;
}) {
  if (!section) {
    return (
      <p className="text-sm text-zinc-500 p-4">
        Select a section in the preview or list to edit its content.
      </p>
    );
  }

  const reg = registryFor(section.sectionType);

  return (
    <div className="space-y-4 p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-200">{section.label}</p>
          <p className="text-[11px] text-zinc-500 font-mono">{section.sectionType}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onChange({ ...section, visible: !section.visible })}
        >
          {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      <Input
        value={section.label}
        onChange={(e) => onChange({ ...section, label: e.target.value })}
        className="text-sm"
        aria-label="Section label"
      />

      {reg.fields.map((field) => (
        <FieldEditor
          key={field.key}
          field={field}
          section={section}
          onChange={onChange}
        />
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onRestoreSection}>
        Restore section default
      </Button>
    </div>
  );
}

function FieldEditor({
  field,
  section,
  onChange,
}: {
  field: SectionFieldDef;
  section: PageSection;
  onChange: (s: PageSection) => void;
}) {
  const setField = (value: unknown) => {
    onChange(patchSectionContent(section, field.key, value));
  };

  if (field.kind === "list") {
    const items = Array.isArray(section.content[field.key])
      ? (section.content[field.key] as ListItem[])
      : [];
    return (
      <ListFieldEditor
        label={field.label}
        items={items}
        section={section}
        fieldKey={field.key}
        onChange={onChange}
      />
    );
  }

  if (field.kind === "image") {
    return (
      <AdminImageUrlField
        label={field.label}
        value={contentStr(section.content, field.key)}
        onChange={(v) => setField(v)}
      />
    );
  }

  const value = contentStr(section.content, field.key);
  const isLong = field.kind === "textarea" || field.kind === "rich_text";

  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{field.label}</Label>
      {isLong ? (
        <Textarea
          rows={4}
          value={value}
          onChange={(e) => setField(e.target.value)}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => setField(e.target.value)}
        />
      )}
    </div>
  );
}

function ListFieldEditor({
  label,
  items,
  section,
  fieldKey,
  onChange,
}: {
  label: string;
  items: ListItem[];
  section: PageSection;
  fieldKey: string;
  onChange: (s: PageSection) => void;
}) {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  function updateItems(next: ListItem[]) {
    onChange({
      ...section,
      content: {
        ...section.content,
        [fieldKey]: next.map((l, i) => ({ ...l, sortOrder: i })),
      },
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-zinc-400">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => updateItems([...sorted, newListItem(sorted.length)])}
        >
          Add line
        </Button>
      </div>
      {sorted.map((item, index) => (
        <LineItemRow
          key={item.id}
          item={item}
          onChange={(next) => {
            const copy = [...sorted];
            copy[index] = next;
            updateItems(copy);
          }}
          onDelete={() => updateItems(sorted.filter((_, i) => i !== index))}
          onMoveUp={() => {
            if (index === 0) return;
            const copy = [...sorted];
            [copy[index - 1], copy[index]] = [copy[index]!, copy[index - 1]!];
            updateItems(copy);
          }}
          onMoveDown={() => {
            if (index >= sorted.length - 1) return;
            const copy = [...sorted];
            [copy[index], copy[index + 1]] = [copy[index + 1]!, copy[index]!];
            updateItems(copy);
          }}
          canMoveUp={index > 0}
          canMoveDown={index < sorted.length - 1}
        />
      ))}
    </div>
  );
}

function LineItemRow({
  item,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  item: ListItem;
  onChange: (item: ListItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className={`rounded border border-zinc-800 p-2 space-y-1 ${!item.visible && "opacity-50"}`}>
      <div className="flex gap-1">
        <button type="button" disabled={!canMoveUp} onClick={onMoveUp} className="p-0.5 text-zinc-500">
          <ChevronUp className="h-3 w-3" />
        </button>
        <button type="button" disabled={!canMoveDown} onClick={onMoveDown} className="p-0.5 text-zinc-500">
          <ChevronDown className="h-3 w-3" />
        </button>
        <Input
          className="flex-1 h-8 text-xs"
          value={item.text}
          onChange={(e) => onChange({ ...item, text: e.target.value })}
        />
        <button type="button" onClick={() => onChange({ ...item, visible: !item.visible })} className="p-1">
          {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        {confirm ? (
          <Button type="button" size="sm" variant="destructive" className="h-8 px-2 text-xs" onClick={onDelete}>
            Yes
          </Button>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="p-1 text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {item.metadata?.body !== undefined ? (
        <Textarea
          rows={2}
          className="text-xs"
          placeholder="Body"
          value={String(item.metadata.body ?? "")}
          onChange={(e) =>
            onChange({ ...item, metadata: { ...item.metadata, body: e.target.value } })
          }
        />
      ) : null}
    </div>
  );
}

export function AddSectionPicker({
  onAdd,
}: {
  onAdd: (type: SectionType) => void;
}) {
  return (
    <select
      className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-950 text-sm text-zinc-200 px-2"
      defaultValue="text_section"
      onChange={(e) => onAdd(e.target.value as SectionType)}
    >
      <option value="text_section">Text section</option>
      <option value="hero">Hero</option>
      <option value="image_text_split">Image + text</option>
      <option value="card_grid">Card grid</option>
      <option value="cta">CTA</option>
      <option value="quote">Quote</option>
      <option value="timeline">Timeline</option>
    </select>
  );
}
