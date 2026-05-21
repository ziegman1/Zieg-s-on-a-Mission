"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { saveProfileSettingsAction } from "@/app/(storefront)/community/settings-actions";
import type { SettingsPageData } from "@/lib/community/settings-types";
import { COMMUNITY_COVER_MAX_BYTES } from "@/lib/community/media-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SettingsFieldGroup,
  SettingsPanel,
  SettingsSaveButton,
} from "./settings-ui";

const UPLOAD_ENDPOINT = "/api/community/upload-profile";

export function SettingsProfilePanel({ data }: { data: SettingsPageData }) {
  const router = useRouter();
  const isOwner = data.isAdmin;
  const isOwnerOnly = isOwner && !data.member;
  const [firstName, setFirstName] = useState(data.member?.firstName ?? "");
  const [lastName, setLastName] = useState(data.member?.lastName ?? "");
  const [displayName, setDisplayName] = useState(data.member?.displayName ?? "");
  const [bio, setBio] = useState(data.member?.bio ?? "");
  const [ownerName, setOwnerName] = useState(data.ownerDisplayName ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(
    data.member?.profileImageUrl ?? data.ownerImageUrl ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const maxMb = Math.round(COMMUNITY_COVER_MAX_BYTES / (1024 * 1024));

  async function handlePhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string; saved?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (!json.url) throw new Error("No URL returned");
      setProfileImageUrl(json.url);
      if (json.saved) router.refresh();
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
      const res = await saveProfileSettingsAction({
        firstName: data.member ? firstName : undefined,
        lastName: data.member ? lastName : undefined,
        displayName,
        bio,
        profileImageUrl: profileImageUrl || "",
        ownerName: isOwnerOnly ? ownerName : undefined,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Profile"
        description={
          isOwner
            ? "This photo appears beside your posts, comments, and owner activity in Mission Hub."
            : "How you appear when you comment and engage in Mission Hub."
        }
        footer={<SettingsSaveButton pending={pending} />}
      >
        <SettingsFieldGroup>
          <div className="space-y-2">
            <Label>Profile photo</Label>
            <div className="flex items-center gap-3">
              {profileImageUrl ? (
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-brand-surface">
                  <Image src={profileImageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-brand-primary/10" />
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading || pending}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  Upload
                </button>
                {profileImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setProfileImageUrl("")}
                    className="text-sm text-brand-ink/50 inline-flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePhoto(f);
              }}
            />
            <p className="text-[11px] text-brand-ink/45 leading-relaxed">
              JPG, PNG, or WebP · max {maxMb} MB
              {isOwner ? " · Saved to your account when uploaded" : ""}
            </p>
          </div>

          {isOwnerOnly ? (
            <div className="space-y-1.5">
              <Label htmlFor="owner-name">Display name</Label>
              <Input
                id="owner-name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                maxLength={120}
                className="bg-white"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={60}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={60}
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Optional — shown instead of full name"
                  maxLength={80}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  rows={3}
                  placeholder="A short intro (optional)"
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="text-sm text-brand-ink/70">{data.email ?? "—"}</p>
            <p className="text-[11px] text-brand-ink/45">Email changes coming in a future update.</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </SettingsFieldGroup>
      </SettingsPanel>
    </form>
  );
}
