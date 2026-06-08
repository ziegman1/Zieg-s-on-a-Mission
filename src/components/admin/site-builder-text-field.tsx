"use client";

import { SiteBuilderRichTextEditor } from "@/components/admin/site-builder-rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { richTextModeForField } from "@/lib/site-builder/rich-text-field-policy";

export function SiteBuilderTextField({
  fieldKey,
  label,
  value,
  onChange,
  multiline,
  placeholder,
  compact,
}: {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const mode = richTextModeForField(fieldKey, { multiline });

  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      {mode === "plain" ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <SiteBuilderRichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeightClass={compact ? "min-h-[80px]" : "min-h-[120px]"}
        />
      )}
    </div>
  );
}
