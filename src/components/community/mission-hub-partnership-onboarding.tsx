"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePartnershipPreferencesAction } from "@/app/(storefront)/community/partnership-actions";
import type { PartnershipPreferences } from "@/lib/community/partnership-preferences";
import { readMissionHubAuthCallback } from "@/lib/community/welcome-intro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MissionHubPartnershipForm } from "./mission-hub-partnership-form";

export function MissionHubPartnershipOnboarding({
  open,
  initialPrefs = null,
  onCompleted,
}: {
  open: boolean;
  initialPrefs?: PartnershipPreferences | null;
  onCompleted: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(92dvh,720px)] overflow-y-auto rounded-2xl border-black/[0.06] p-0 gap-0 sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="px-5 pt-5 pb-5 sm:px-6 sm:pb-6">
          <DialogHeader className="text-left space-y-2 mb-4">
            <DialogTitle className="font-serif text-xl text-brand-ink tracking-wide">
              How would you like to partner in the mission?
            </DialogTitle>
            <DialogDescription className="text-sm text-brand-ink/60 leading-relaxed">
              Choose the updates and opportunities you&apos;d like to receive. You can update
              these preferences anytime in Settings.
            </DialogDescription>
          </DialogHeader>
          <MissionHubPartnershipForm
            initialPrefs={initialPrefs}
            pending={pending}
            error={error}
            submitLabel="Save preferences"
            onSubmit={(selection) => {
              setError(null);
              startTransition(async () => {
                const res = await savePartnershipPreferencesAction(selection, {
                  authCallbackUrl: readMissionHubAuthCallback(),
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                onCompleted();
                if (res.redirectTo) {
                  router.push(res.redirectTo);
                }
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
