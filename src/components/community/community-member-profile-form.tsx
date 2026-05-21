"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { COMMUNITY_COVER_MAX_BYTES } from "@/lib/community/media-upload";
import type { CommunityMemberProfile } from "@/lib/community/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UPLOAD_ENDPOINT = "/api/community/upload-profile";

export function CommunityMemberProfileForm({
  onCreated,
  createAction,
}: {
  onCreated: (member: CommunityMemberProfile) => void;
  createAction: (input: {
    firstName: string;
    lastName: string;
    email?: string;
    profileImageUrl?: string;
  }) => Promise<{ ok: true; member: CommunityMemberProfile } | { ok: false; error: string }>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxMb = Math.round(COMMUNITY_COVER_MAX_BYTES / (1024 * 1024));

  async function handlePhoto(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (!data.url) throw new Error("No URL returned");
      setProfileImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createAction({
        firstName,
        lastName,
        email: email.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated(res.member);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-primary/15 bg-brand-surface/40 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-brand-ink">
          Create your Mission Hub profile to comment
        </h4>
        <p className="text-xs text-brand-ink/60 mt-1">
          One quick setup — we&apos;ll remember you on this device.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mh-member-first" className="text-xs text-brand-ink/70">
            First name
          </Label>
          <Input
            id="mh-member-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={60}
            disabled={isPending}
            className="h-9 text-sm bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mh-member-last" className="text-xs text-brand-ink/70">
            Last name
          </Label>
          <Input
            id="mh-member-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={60}
            disabled={isPending}
            className="h-9 text-sm bg-white"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mh-member-email" className="text-xs text-brand-ink/70">
          Email <span className="text-brand-ink/45 font-normal">(optional)</span>
        </Label>
        <Input
          id="mh-member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          disabled={isPending}
          className="h-9 text-sm bg-white"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-brand-ink/70">
          Profile picture <span className="text-brand-ink/45 font-normal">(optional)</span>
        </Label>
        {profileImageUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-full overflow-hidden border border-brand-primary/15">
              <Image src={profileImageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <button
              type="button"
              onClick={() => setProfileImageUrl("")}
              className="text-xs font-medium text-brand-ink/60 hover:text-brand-ink inline-flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Remove photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading || isPending}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 px-3 py-2 text-xs font-medium text-brand-primary hover:bg-white transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden />
            )}
            Add photo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePhoto(file);
          }}
        />
        <p className="text-[11px] text-brand-ink/45">JPG, PNG, or WebP · max {maxMb} MB</p>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <Button type="submit" size="sm" disabled={isPending} className="rounded-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Saving…
          </>
        ) : (
          "Create profile"
        )}
      </Button>
    </form>
  );
}
