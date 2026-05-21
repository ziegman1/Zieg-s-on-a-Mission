"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Admin space creation — disabled until Mission Hub admin ships.
 */
export function CreateFirstSpaceButton() {
  return (
    <Button
      type="button"
      disabled
      title="Space management for admins is coming soon"
      className="rounded-full px-8 h-12 bg-brand-accent/60 text-brand-ink/70 font-semibold cursor-not-allowed"
      aria-describedby="create-space-hint"
    >
      <Plus className="h-4 w-4 mr-2" aria-hidden />
      Create First Space
    </Button>
  );
}
