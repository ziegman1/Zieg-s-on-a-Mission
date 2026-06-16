"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCampaignPledgedAmountAction } from "@/app/admin/support-campaign/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupportCampaignPledgeIntent } from "@/lib/support-campaign/campaign-state";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SupportCampaignAdminManager({
  goalAmount,
  pledgedAmount,
  recentIntents,
}: {
  goalAmount: number;
  pledgedAmount: number;
  recentIntents: SupportCampaignPledgeIntent[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(pledgedAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-brand-primary/25 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-cream">Campaign totals</CardTitle>
          <CardDescription>
            Correct the shared monthly pledged total shown on the public campaign page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-zinc-500">Monthly goal</dt>
              <dd className="mt-1 text-lg font-semibold text-brand-primary">
                {formatCurrency(goalAmount)}/month
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Current pledged total</dt>
              <dd className="mt-1 text-lg font-semibold text-cream">
                {formatCurrency(pledgedAmount)}/month
              </dd>
            </div>
          </dl>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end pt-2 border-t border-zinc-800"
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
              <Label htmlFor="campaign-pledged-total" className="text-zinc-300">
                Correct pledged total
              </Label>
              <Input
                id="campaign-pledged-total"
                type="number"
                min={0}
                step={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1.5 bg-zinc-950 border-zinc-700"
                disabled={pending}
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {pending ? "Saving…" : "Save corrected total"}
            </Button>
          </form>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </CardContent>
      </Card>

      {recentIntents.length > 0 ? (
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Recent pledge clicks</CardTitle>
            <CardDescription>
              Public partnership-card clicks that added to the shared total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-zinc-800 text-sm">
              {recentIntents.map((intent) => (
                <li key={intent.id} className="flex items-center justify-between py-2.5 gap-4">
                  <span className="font-medium text-cream">{formatCurrency(intent.amount)}</span>
                  <span className="text-zinc-500 shrink-0">{formatDateTime(intent.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
