"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminImageUrlField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) onChange(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">{label}</Label>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="bg-zinc-950 border-zinc-700"
      />
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFile}
          disabled={busy}
          className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-brand-primary/30 file:px-2 file:py-1 file:text-zinc-200"
        />
        {busy ? <span className="text-xs text-zinc-500">Uploading…</span> : null}
      </div>
    </div>
  );
}
