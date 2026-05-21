export function CommunityWelcomeCard({
  siteName,
  intro,
}: {
  siteName: string;
  intro: string;
}) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary/96 to-brand-primary/85 text-white shadow-[0_8px_28px_rgba(28,42,68,0.18)] overflow-hidden ring-1 ring-white/10">
      <div className="px-5 py-6 sm:px-6 sm:py-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
          Mission Hub
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-[1.75rem] tracking-wide leading-tight">
          Our family space
        </h1>
        <p className="mt-1.5 text-sm text-white/75">{siteName}</p>
        <p className="mt-4 text-[15px] leading-[1.55] text-white/92">{intro}</p>
      </div>
    </section>
  );
}
