import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommunityFeedEmpty({
  title = "Nothing here yet",
  body = "When your team shares an update, it will appear in this feed.",
  showAdminCreate = false,
  variant = "hub",
}: {
  title?: string;
  body?: string;
  showAdminCreate?: boolean;
  variant?: "hub" | "space";
}) {
  const spaceTitle = variant === "space" ? "No posts in this space" : title;

  return (
    <p className="py-12 text-center text-sm text-brand-ink/50 leading-relaxed">
      <span className="block font-medium text-brand-ink/65 mb-1">{spaceTitle}</span>
      {variant === "space"
        ? "Try All posts to see everything, or check back soon."
        : body}
      {variant === "space" ? (
        <Link
          href="/community"
          className="mt-3 inline-block text-brand-primary font-medium hover:underline"
        >
          View all posts
        </Link>
      ) : null}
      {showAdminCreate ? (
        <Button
          asChild
          className="mt-4 rounded-full bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
        >
          <Link href="/admin/community">
            <Plus className="h-4 w-4 mr-2" aria-hidden />
            Create space
          </Link>
        </Button>
      ) : null}
    </p>
  );
}
