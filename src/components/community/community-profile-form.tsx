"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { updateMemberProfileAction } from "@/app/(storefront)/community/auth-actions";
import type { CommunityMemberProfile } from "@/lib/community/members";
import { COMMUNITY_COVER_MAX_BYTES } from "@/lib/community/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UPLOAD_ENDPOINT = "/api/community/upload-profile";

export function CommunityProfileForm({ member }: { member: CommunityMemberProfile }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(member.firstName);
  const [lastName, setLastName] = useState(member.lastName);
  const [profileImageUrl, setProfileImageUrl] = useState(member.profileImageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
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
      const res = await updateMemberProfileAction({
        firstName,
        lastName,
        profileImageUrl: profileImageUrl.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-primary/15 bg-white/95 p-5 sm:p-6 space-y-5 shadow-sm max-w-lg">
      <div>
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">Your profile</h2>
        <p className="text-sm text-brand-ink/60 mt-1">
          This is how you appear when you comment. Email changes coming later.
        </p>
        {member.email ? (
          <p className="text-xs text-brand-ink/50 mt-2">
            Signed in as <span className="font-medium text-brand-ink">{member.email}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Profile picture</Label>
        {profileImageUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-brand-primary/15">
              <Image src={profileImageUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <button
              type="button"
              onClick={() => setProfileImageUrl("")}
              className="text-xs font-medium text-brand-ink/60 hover:text-brand-ink inline-flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading || isPending}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 px-3 py-2 text-sm font-medium text-brand-primary"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden />
            )}
            Upload photo
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-first">First name</Label>
          <Input
            id="profile-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={60}
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-last">Last name</Label>
          <Input
            id="profile-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={60}
            className="bg-white"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="rounded-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
