"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BuilderPreviewProvider } from "@/components/site-builder/builder-preview-context";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { BUILDER_PAGES } from "@/lib/site-builder/types";
import type { PageSection, SectionType } from "@/lib/site-builder/types";
import { registryFor } from "@/lib/site-builder/registry";
import { newBlockId } from "@/lib/site-copy-blocks/utils";
import { selectionFromElement } from "@/lib/site-builder/section-elements";
import {
  loadBuilderPageAction,
  publishAllBuilderPagesAction,
  restoreBuilderPageDefaultsAction,
  restoreBuilderSectionDefaultsAction,
  saveBuilderPageAction,
} from "./actions";
import {
  AddSectionPicker,
  SectionPropertiesPanel,
} from "./section-properties-panel";
import { ElementPropertiesPanel } from "./element-properties-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

type PageData = Record<
  string,
  { sections: PageSection[]; hasCustom: boolean }
>;

export function SiteBuilderEditor({ initialPages }: { initialPages: PageData }) {
  const [pages, setPages] = useState<PageData>(initialPages);
  const [activePage, setActivePage] = useState("home");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveDiagnostics, setSaveDiagnostics] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const sections = pages[activePage]?.sections ?? [];
  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;
  const pageMeta = BUILDER_PAGES.find((p) => p.pageKey === activePage);
  const pageLabel = pageMeta?.label ?? activePage;

  const elementSelection = useMemo(() => {
    if (!selectedSection || !selectedElementId) return null;
    return selectionFromElement(selectedSection, selectedElementId);
  }, [selectedSection, selectedElementId]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const updateSections = useCallback(
    (next: PageSection[]) => {
      setPages((p) => ({
        ...p,
        [activePage]: { sections: next, hasCustom: p[activePage]?.hasCustom ?? false },
      }));
      setDirty(true);
    },
    [activePage],
  );

  function patchSection(id: string, next: PageSection) {
    updateSections(sections.map((s) => (s.id === id ? next : s)));
  }

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    updateSections(next.map((s, i) => ({ ...s, sortOrder: i })));
  }

  function duplicateSection(section: PageSection) {
    const copy: PageSection = {
      ...structuredClone(section),
      id: newBlockId(),
      sectionKey: `${section.sectionKey}-copy-${Date.now()}`,
      label: `${section.label} (copy)`,
      sortOrder: sections.length,
    };
    updateSections([...sections, copy]);
  }

  function deleteSection(id: string) {
    updateSections(sections.filter((s) => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
      setSelectedElementId(null);
    }
  }

  function addSection(type: SectionType) {
    const reg = registryFor(type);
    const key = `custom-${Date.now()}`;
    const block: PageSection = {
      id: newBlockId(),
      pageKey: activePage,
      sectionKey: key,
      sectionType: type,
      label: `New ${reg.label}`,
      visible: true,
      sortOrder: sections.length,
      content: structuredClone(reg.defaultContent),
      settings: structuredClone(reg.defaultSettings ?? {}),
    };
    updateSections([...sections, block]);
    setSelectedSectionId(block.id);
    setSelectedElementId(null);
  }

  async function applySaveResult(res: Awaited<ReturnType<typeof saveBuilderPageAction>>) {
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      setSuccessMessage(null);
      setSaveDiagnostics(null);
      return false;
    }
    const reload = await loadBuilderPageAction(activePage);
    if (reload.ok) {
      setPages((p) => ({
        ...p,
        [activePage]: { sections: reload.sections, hasCustom: reload.hasCustom },
      }));
      if (selectedSectionId) {
        const still = reload.sections.find((s) => s.sectionKey === sections.find((x) => x.id === selectedSectionId)?.sectionKey);
        if (still) setSelectedSectionId(still.id);
      }
    } else {
      setPages((p) => ({
        ...p,
        [activePage]: { sections, hasCustom: true },
      }));
    }
    setDirty(false);
    setStatus("saved");
    setError(null);
    setSuccessMessage(res.message);
    const diag = res.diagnostics;
    setSaveDiagnostics(
      `page_key=${res.pageKey} · saved=${res.savedCount} · visible=${diag.visibleCount} · updated=${diag.latestUpdatedAt ?? "—"}`,
    );
    setTimeout(() => setStatus("idle"), 4000);
    return true;
  }

  async function handleSave() {
    setStatus("saving");
    setError(null);
    setSuccessMessage(null);
    await applySaveResult(await saveBuilderPageAction(activePage, sections));
  }

  async function handlePublishAll() {
    setStatus("saving");
    setError(null);
    setSuccessMessage(null);
    const res = await publishAllBuilderPagesAction(activePage, sections);
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      return;
    }
    const reload = await loadBuilderPageAction(activePage);
    if (reload.ok) {
      setPages((p) => ({
        ...p,
        [activePage]: { sections: reload.sections, hasCustom: reload.hasCustom },
      }));
    }
    setDirty(false);
    setStatus("saved");
    setSuccessMessage(res.message);
    setSaveDiagnostics(`Revalidated ${res.revalidated.length} paths`);
    setTimeout(() => setStatus("idle"), 5000);
  }

  async function handleRestorePage() {
    const res = await restoreBuilderPageDefaultsAction(activePage);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    updateSections(res.sections);
    setConfirmRestore(false);
    setDirty(true);
  }

  const previewContext = useMemo(
    () => ({
      editMode: true as const,
      selectedSectionId,
      selectedElementId,
      onSelectSection: (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setSelectedElementId(null);
      },
      onSelectElement: (sectionId: string, elementId: string) => {
        setSelectedSectionId(sectionId);
        setSelectedElementId(elementId);
      },
      selection: elementSelection,
    }),
    [selectedSectionId, selectedElementId, elementSelection],
  );

  const breadcrumb = selectedElementId && elementSelection
    ? `${pageLabel} › ${selectedSection?.label ?? "Section"} › ${elementSelection.label}`
    : selectedSection
      ? `${pageLabel} › ${selectedSection.label}`
      : pageLabel;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[32rem] -mx-4 sm:-mx-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/90 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : dirty ? "Save page" : "Saved"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void handlePublishAll()}>
            Publish & refresh
          </Button>
          {pageMeta?.path ? (
            <Button type="button" size="sm" variant="ghost" asChild>
              <Link href={pageMeta.path} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Live
              </Link>
            </Button>
          ) : null}
          <Link href="/admin/site-copy" className="text-xs text-zinc-500 hover:text-zinc-300 ml-2">
            Advanced blocks
          </Link>
        </div>
        {confirmRestore ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="destructive" onClick={() => void handleRestorePage()}>
              Confirm restore page
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRestore(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => setConfirmRestore(true)}>
            Restore page defaults
          </Button>
        )}
      </div>

      {error ? (
        <p className="px-4 py-2 text-sm text-red-400 whitespace-pre-wrap">{error}</p>
      ) : null}
      {successMessage ? (
        <p className="px-4 py-1 text-sm text-emerald-400">{successMessage}</p>
      ) : null}
      {saveDiagnostics ? (
        <p className="px-4 pb-2 text-[11px] text-zinc-500 font-mono">{saveDiagnostics}</p>
      ) : null}

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Pages
          </p>
          <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {BUILDER_PAGES.map((p) => (
              <button
                key={p.pageKey}
                type="button"
                onClick={() => {
                  setActivePage(p.pageKey);
                  setSelectedSectionId(null);
                  setSelectedElementId(null);
                }}
                className={cn(
                  "w-full text-left rounded-md px-2.5 py-2 text-sm transition-colors",
                  activePage === p.pageKey
                    ? "bg-brand-primary/20 text-brand-primary"
                    : "text-zinc-400 hover:bg-zinc-900",
                )}
              >
                {p.label}
              </button>
            ))}
          </nav>
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 border-t border-zinc-800">
            Sections
          </p>
          <ul className="overflow-y-auto max-h-[40vh] px-2 pb-3 space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectionId(s.id);
                    setSelectedElementId(null);
                  }}
                  className={cn(
                    "w-full text-left rounded-md px-2 py-1.5 text-xs flex items-center gap-1",
                    selectedSectionId === s.id && !selectedElementId
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900",
                    !s.visible && "opacity-50",
                  )}
                >
                  {!s.visible ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0 opacity-40" />}
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-zinc-800 space-y-2">
            <AddSectionPicker onAdd={addSection} />
          </div>
        </aside>

        <div className="flex-1 min-w-0 overflow-auto bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 mb-1 truncate" title={breadcrumb}>
            {breadcrumb}
          </p>
          <p className="text-[11px] text-zinc-600 mb-2">
            Click any text, card, button, or image in the preview to edit it.
          </p>
          <div
            className="rounded-lg border border-zinc-700 overflow-hidden shadow-xl bg-white max-w-4xl mx-auto"
            onClick={() => setSelectedElementId(null)}
          >
            <BuilderPreviewProvider value={previewContext}>
              <div className="bg-brand-surface text-brand-ink origin-top scale-[0.72] w-[139%] -ml-[19.5%]">
                <PageSectionsRenderer
                  pageKey={activePage}
                  sections={sections}
                  siteTagline=""
                  editMode
                />
              </div>
            </BuilderPreviewProvider>
          </div>
        </div>

        <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col">
          {selectedSection && elementSelection ? (
            <ElementPropertiesPanel
              pageKey={activePage}
              section={selectedSection}
              selection={elementSelection}
              onChange={(next) => patchSection(selectedSection.id, next)}
              onDeleted={() => setSelectedElementId(null)}
            />
          ) : selectedSection ? (
            <>
              <div className="flex gap-1 p-2 border-b border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={sections.findIndex((s) => s.id === selectedSection.id) <= 0}
                  onClick={() =>
                    moveSection(
                      sections.findIndex((s) => s.id === selectedSection.id),
                      -1,
                    )
                  }
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    moveSection(
                      sections.findIndex((s) => s.id === selectedSection.id),
                      1,
                    )
                  }
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => duplicateSection(selectedSection)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400"
                  onClick={() => {
                    if (window.confirm(`Delete section "${selectedSection.label}"?`)) {
                      deleteSection(selectedSection.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <SectionPropertiesPanel
                section={selectedSection}
                onChange={(next) => patchSection(selectedSection.id, next)}
                onRestoreSection={async () => {
                  const res = await restoreBuilderSectionDefaultsAction(
                    activePage,
                    selectedSection.sectionKey,
                    sections,
                  );
                  if (res.ok) {
                    updateSections(res.sections);
                    setDirty(true);
                  }
                }}
              />
            </>
          ) : (
            <SectionPropertiesPanel
              section={null}
              onChange={() => {}}
              onRestoreSection={() => {}}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
