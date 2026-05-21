import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateFirstSpaceButton } from "./create-first-space-button";

export function EmptyCommunityState({ showAdminCreateLink = false }: { showAdminCreateLink?: boolean }) {
  return (
    <Card className="border-brand-primary/25 bg-white/80 shadow-md">
      <CardContent className="flex flex-col items-center text-center px-6 py-12 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">Your hub</p>
        <h2 className="mt-3 font-serif text-2xl text-brand-ink tracking-wide">No spaces yet</h2>
        <p className="mt-3 max-w-md text-brand-ink/80 leading-relaxed">
          No spaces have been created yet. When Jeremy and Lindsay open the first space, posts and
          updates will appear here for our ministry family.
        </p>
        <div className="mt-8">
          {showAdminCreateLink ? (
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
            >
              <Link href="/admin/community">
                <Plus className="h-4 w-4 mr-2" aria-hidden />
                Create First Space
              </Link>
            </Button>
          ) : (
            <CreateFirstSpaceButton />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
