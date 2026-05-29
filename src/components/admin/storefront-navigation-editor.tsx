"use client";

import { useState } from "react";
import type { SiteCopy } from "@/data/site-copy-defaults";
import {
  GET_INVOLVED_NAV,
  GIVE_NOW_NAV,
  STOREFRONT_HEADER_NAV,
  type GetInvolvedNavItem,
} from "@/data/storefront-navigation";
import type { ContentBlock } from "@/lib/site-copy-blocks/types";
import {
  patchStorefrontNavigationBlocks,
  type StorefrontNavExtras,
} from "@/lib/site-copy-blocks/navigation-extras";
import {
  loadSiteCopyBlocksAction,
  saveSiteCopyBlocksAction,
} from "@/app/admin/site-copy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-zinc-300 text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function StorefrontNavigationEditor({
  initialCopy,
  initialExtras,
}: {
  initialCopy: SiteCopy;
  initialExtras: StorefrontNavExtras;
}) {
  const [navLinks, setNavLinks] = useState(() =>
    structuredClone(JSON.parse(JSON.stringify(initialCopy.navLinks)) as SiteCopy["navLinks"]),
  );
  const [giveNowLabel, setGiveNowLabel] = useState(initialExtras.giveNowLabel);
  const [getInvolvedItems, setGetInvolvedItems] = useState<GetInvolvedNavItem[]>(() =>
    structuredClone(JSON.parse(JSON.stringify(initialExtras.getInvolvedItems))),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);

    const loaded = await loadSiteCopyBlocksAction();
    if (!loaded.ok) {
      setStatus("error");
      setErrorMsg(loaded.error);
      return;
    }

    const patched = patchStorefrontNavigationBlocks(loaded.blocks as ContentBlock[], {
      navLinks,
      giveNowLabel,
      getInvolvedItems,
    });

    const res = await saveSiteCopyBlocksAction(patched);
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(res.error);
      return;
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  const headerNavLinks = navLinks.filter((link) =>
    STOREFRONT_HEADER_NAV.some((h) => h.href === link.href),
  );
  const getInvolvedNavLink = navLinks.find((l) => l.href === GET_INVOLVED_NAV.labelHref);

  return (
    <div className="rounded-lg border border-brand-primary/40 bg-zinc-950/80 p-4 space-y-4 mb-4">
      <div>
        <h2 className="font-medium text-brand-primary text-sm">Live header navigation</h2>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
          These labels update the storefront header immediately after save. Structure: Home · About · Mission ·{" "}
          Get Involved ▼ · Community · Blog · Contact, plus Give Now. Merch stays in the footer only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {headerNavLinks.map((link) => {
          const idx = navLinks.findIndex((l) => l.href === link.href);
          return (
            <Field key={link.href} label={`${link.href}`}>
              <Input
                value={link.label}
                onChange={(e) =>
                  setNavLinks((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx]!, label: e.target.value };
                    return next;
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </Field>
          );
        })}
      </div>

      {getInvolvedNavLink ? (
        <Field label={`Get Involved dropdown label (${GET_INVOLVED_NAV.labelHref})`}>
          <Input
            value={getInvolvedNavLink.label}
            onChange={(e) =>
              setNavLinks((prev) =>
                prev.map((l) =>
                  l.href === GET_INVOLVED_NAV.labelHref ? { ...l, label: e.target.value } : l,
                ),
              )
            }
            className="bg-zinc-900 border-zinc-700"
          />
        </Field>
      ) : null}

      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Get Involved menu items</p>
        {getInvolvedItems.map((item, i) => (
          <div key={item.href} className="rounded-md border border-zinc-800 p-3 space-y-2">
            <p className="text-[11px] text-zinc-600 font-mono">{item.href}</p>
            <Field label="Label">
              <Input
                value={item.label}
                onChange={(e) =>
                  setGetInvolvedItems((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i]!, label: e.target.value };
                    return next;
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={2}
                value={item.description ?? ""}
                onChange={(e) =>
                  setGetInvolvedItems((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i]!, description: e.target.value };
                    return next;
                  })
                }
                className="bg-zinc-900 border-zinc-700"
              />
            </Field>
          </div>
        ))}
      </div>

      <Field label={`Give Now button (${GIVE_NOW_NAV.href})`}>
        <Input
          value={giveNowLabel}
          onChange={(e) => setGiveNowLabel(e.target.value)}
          className="bg-zinc-900 border-zinc-700"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" size="sm" onClick={() => void handleSave()} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save navigation labels"}
        </Button>
        {status === "error" && errorMsg ? (
          <p className="text-xs text-red-400">{errorMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
