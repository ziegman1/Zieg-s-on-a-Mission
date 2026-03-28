export const dynamic = "force-static";

export default function MerchPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
          Zieg&apos;s on a Mission Merch
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Merch Coming Soon
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          We&apos;re working on launching branded merch for Zieg&apos;s on a Mission.
          Check back soon for apparel, drinkware, and other items that help support the mission.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Return Home
          </a>
          <a
            href="/contact"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  );
}
