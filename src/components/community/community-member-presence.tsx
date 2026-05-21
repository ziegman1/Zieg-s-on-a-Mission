import { cn } from "@/lib/utils";

export function CommunityMemberPresence({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const first = name.split(/\s+/)[0] ?? name;
  return (
    <p
      className={cn(
        "text-sm text-brand-ink/70 px-0.5",
        className,
      )}
    >
      Welcome back,{" "}
      <span className="font-semibold text-brand-ink">{first}</span>
    </p>
  );
}
