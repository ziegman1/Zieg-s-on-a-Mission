"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import { normalizeRichTextForStorage, prepareRichTextForEditor } from "@/lib/site-builder/rich-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Brand serif", value: "var(--font-serif, Georgia, serif)" },
];

const SIZE_OPTIONS = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "XL", value: "20px" },
];

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 w-7 p-0 text-zinc-300 hover:text-white hover:bg-zinc-800",
        active && "bg-zinc-800 text-white",
      )}
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

export function SiteBuilderRichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeightClass = "min-h-[120px]",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClass?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const node = editorRef.current;
    if (!node || focused) return;
    const html = prepareRichTextForEditor(value);
    if (node.innerHTML !== html) {
      node.innerHTML = html;
    }
  }, [value, focused]);

  const emitChange = useCallback(() => {
    const node = editorRef.current;
    if (!node) return;
    onChange(normalizeRichTextForStorage(node.innerHTML));
  }, [onChange]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      emitChange();
    },
    [emitChange],
  );

  const applyFont = (fontFamily: string) => {
    editorRef.current?.focus();
    if (!fontFamily) {
      document.execCommand("removeFormat", false);
    } else {
      document.execCommand("fontName", false, fontFamily);
    }
    emitChange();
  };

  const applySize = (fontSize: string) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, "3");
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const node = selection.anchorNode;
    const element =
      node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node?.parentElement;
    if (element) element.style.fontSize = fontSize;
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (!url?.trim()) return;
    exec("createLink", url.trim());
  };

  return (
    <div className={cn("rounded-md border border-zinc-700 bg-zinc-950 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800 bg-zinc-900/90 px-1.5 py-1">
        <ToolbarButton label="Undo" onClick={() => exec("undo")}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => exec("redo")}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-zinc-700" aria-hidden />

        <select
          className="h-7 max-w-[6.5rem] rounded border border-zinc-700 bg-zinc-950 px-1 text-[11px] text-zinc-200"
          defaultValue=""
          onChange={(event) => applyFont(event.target.value)}
          aria-label="Font family"
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="h-7 max-w-[5.5rem] rounded border border-zinc-700 bg-zinc-950 px-1 text-[11px] text-zinc-200"
          defaultValue="16px"
          onChange={(event) => applySize(event.target.value)}
          aria-label="Font size"
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="mx-1 h-4 w-px bg-zinc-700" aria-hidden />

        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-zinc-700" aria-hidden />

        <ToolbarButton label="Paragraph" onClick={() => exec("formatBlock", "p")}>
          <span className="text-[10px] font-semibold">P</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 1" onClick={() => exec("formatBlock", "h1")}>
          <span className="text-[10px] font-semibold">H1</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 2" onClick={() => exec("formatBlock", "h2")}>
          <span className="text-[10px] font-semibold">H2</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => exec("formatBlock", "h3")}>
          <span className="text-[10px] font-semibold">H3</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 4" onClick={() => exec("formatBlock", "h4")}>
          <span className="text-[10px] font-semibold">H4</span>
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Block quote" onClick={() => exec("formatBlock", "blockquote")}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align left" onClick={() => exec("justifyLeft")}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => exec("justifyCenter")}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => exec("justifyRight")}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton label="Insert link" onClick={insertLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className={cn(
          "site-builder-rich-text-editor px-3 py-2 text-sm text-zinc-100 outline-none",
          "prose prose-invert max-w-none",
          "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_h4]:text-sm [&_h4]:font-semibold",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-sky-400 [&_a]:underline",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500",
          minHeightClass,
        )}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          emitChange();
        }}
        onInput={emitChange}
      />
    </div>
  );
}

/** Alias for the shared Site Builder rich text editor. */
export const RichTextEditor = SiteBuilderRichTextEditor;
