"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCampaignPledgedAmountAction } from "@/app/(storefront)/support-campaign/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SupportCampaignAdminPanel({
  pledgedAmount,
  goalAmount,
}: {
  pledgedAmount: number;
  goalAmount: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(pledgedAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 rounded-xl border border-dashed border-brand-primary/35 bg-white/60 p-4 sm:p-5 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
        Admin campaign controls
      </p>
      <p className="mt-1 text-sm text-brand-ink/70 leading-relaxed">
        Update the shared monthly pledged total shown on this page for all visitors. Goal:{" "}
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(goalAmount)}
        /month.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const parsed = Number(value);
          startTransition(async () => {
            const result = await updateCampaignPledgedAmountAction(parsed);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="flex-1">
          <Label htmlFor="campaign-pledged-total" className="text-sm text-brand-ink">
            Current monthly pledged total
          </Label>
          <Input
            id="campaign-pledged-total"
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1.5 bg-white"
            disabled={pending}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {pending ? "Saving…" : "Save shared total"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
