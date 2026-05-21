import { Card, CardContent } from "@/components/ui/card";

export function CommunitySpaceEmptyPosts() {
  return (
    <Card className="border-brand-primary/25 bg-white/80 shadow-sm">
      <CardContent className="px-6 py-10 sm:py-12 text-center">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">
          No posts have been shared here yet.
        </h2>
        <p className="mt-3 max-w-lg mx-auto text-brand-ink/80 leading-relaxed">
          Check back soon as we begin sharing updates, prayer needs, stories, and resources with
          our ministry family.
        </p>
      </CardContent>
    </Card>
  );
}
