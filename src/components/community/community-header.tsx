export function CommunityHeader({
  eyebrow = "Community",
  title = "Mission Hub",
  intro,
}: {
  eyebrow?: string;
  title?: string;
  intro: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-white/80 via-brand-surface to-brand-primary/10 px-6 py-10 sm:px-10 sm:py-12 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-brand-ink/85 leading-relaxed">{intro}</p>
    </header>
  );
}
