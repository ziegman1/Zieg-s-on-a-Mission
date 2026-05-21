"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  joinCommunityAction,
  type CommunityAuthState,
} from "@/app/(storefront)/community/auth-actions";
import { COMMUNITY_COVER_MAX_BYTES } from "@/lib/community/media-upload";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { CommunityAuthCard } from "./community-auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: CommunityAuthState = { error: null };
const UPLOAD_ENDPOINT = "/api/community/upload-profile";

export function CommunityJoinForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [state, formAction, pending] = useActionState(joinCommunityAction, initial);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxMb = Math.round(COMMUNITY_COVER_MAX_BYTES / (1024 * 1024));

  async function handlePhoto(file: File) {
    setUploadError(null);
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
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <CommunityAuthCard
      title="Join Mission Hub"
      description="Create your account to comment, follow our journey, and stay connected."
      footer={
        <p className="text-xs text-brand-ink/55 text-center pt-2">
          Already have an account?{" "}
          <Link
            href={`/community/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-brand-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="profileImageUrl" value={profileImageUrl} />
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="join-first">First name</Label>
            <Input id="join-first" name="firstName" required maxLength={60} className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="join-last">Last name</Label>
            <Input id="join-last" name="lastName" required maxLength={60} className="bg-white" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="join-email">Email</Label>
          <Input
            id="join-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="join-password">Password</Label>
          <Input
            id="join-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="bg-white"
          />
          <p className="text-[11px] text-brand-ink/45">At least 8 characters</p>
        </div>
        <div className="space-y-2">
          <Label className="text-brand-ink/70">
            Profile picture <span className="font-normal text-brand-ink/45">(optional)</span>
          </Label>
          {profileImageUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-full overflow-hidden border border-brand-primary/15">
                <Image src={profileImageUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={() => setProfileImageUrl("")}
                className="text-xs text-brand-ink/60 hover:text-brand-ink inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading || pending}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 px-3 py-2 text-xs font-medium text-brand-primary"
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
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          <p className="text-[11px] text-brand-ink/45">JPG, PNG, or WebP · max {maxMb} MB</p>
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </CommunityAuthCard>
  );
}
