"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GET_INVOLVED_NAV,
  GIVE_NOW_NAV,
  STOREFRONT_HEADER_NAV,
  navLabel,
  type NavLabelOverrides,
  type GetInvolvedNavItem,
} from "@/data/storefront-navigation";
import { MERCH_STORE_ENABLED } from "@/data/shop-config";
import { cn } from "@/lib/utils";

/** Phone-only below Tailwind `md` (768px). Tablet/desktop use full nav. */
const DESKTOP_NAV_CLASS = "hidden md:flex";

const NAV_LINK_CLASS =
  "text-xs md:text-[13px] lg:text-sm text-white hover:text-white/90 transition-colors whitespace-nowrap";

export function StorefrontHeader({
  siteName,
  labelOverrides = {},
  giveNowLabel,
  getInvolvedItems,
}: {
  siteName: string;
  labelOverrides?: NavLabelOverrides;
  giveNowLabel?: string;
  getInvolvedItems?: GetInvolvedNavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [involvedOpen, setInvolvedOpen] = useState(false);
  const mobilePanelId = useId();
  const involvedPanelId = useId();

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setInvolvedOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, closeMobile]);

  const involvedItems = getInvolvedItems ?? GET_INVOLVED_NAV.items;

  const getInvolvedLabel = navLabel(
    GET_INVOLVED_NAV.labelHref,
    GET_INVOLVED_NAV.label,
    labelOverrides,
  );

  const resolvedGiveNowLabel =
    giveNowLabel?.trim() ||
    navLabel(GIVE_NOW_NAV.href, GIVE_NOW_NAV.label, labelOverrides);

  const giveNowButton = (
    <Button
      asChild
      size="sm"
      className="rounded-full h-9 px-3.5 sm:px-5 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold text-xs sm:text-sm shadow-sm shrink-0"
    >
      <Link href={GIVE_NOW_NAV.href} onClick={closeMobile}>
        {resolvedGiveNowLabel}
      </Link>
    </Button>
  );

  const getInvolvedDropdownDesktop = (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          NAV_LINK_CLASS,
          "inline-flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm",
        )}
        aria-label={`${getInvolvedLabel} menu`}
      >
        {getInvolvedLabel}
        <ChevronDown className="h-3.5 w-3.5 opacity-90" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[16rem] border-brand-primary/20 bg-white p-2 shadow-lg"
      >
        {involvedItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="p-0 focus:bg-transparent">
            <Link
              href={item.href}
              className="block w-full rounded-md px-3 py-2.5 cursor-pointer hover:bg-brand-primary/10 focus:bg-brand-primary/10 outline-none"
            >
              <span className="font-medium text-brand-ink">{item.label}</span>
              {item.description ? (
                <span className="mt-0.5 block text-xs text-brand-ink/70 leading-snug">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const getInvolvedAccordionMobile = (
    <div>
      <button
        type="button"
        id={`${involvedPanelId}-trigger`}
        aria-expanded={involvedOpen}
        aria-controls={involvedPanelId}
        onClick={() => setInvolvedOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
      >
        <span>{getInvolvedLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", involvedOpen && "rotate-180")}
          aria-hidden
        />
      </button>
      {involvedOpen ? (
        <div
          id={involvedPanelId}
          role="region"
          aria-labelledby={`${involvedPanelId}-trigger`}
          className="mt-1 ml-2 pl-2 border-l border-white/20 bg-white/95 rounded-lg p-2 text-brand-ink"
        >
          {involvedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className="block rounded-lg px-3 py-2.5 hover:bg-brand-primary/10 transition-colors"
            >
              <span className="font-medium text-brand-ink">{item.label}</span>
              {item.description ? (
                <span className="mt-0.5 block text-sm text-brand-ink/70 leading-snug">
                  {item.description}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  const beforeMission = STOREFRONT_HEADER_NAV.filter((item) =>
    ["/", "/about"].includes(item.href),
  );
  const afterMission = STOREFRONT_HEADER_NAV.filter((item) =>
    ["/community", "/blog", "/contact"].includes(item.href),
  );
  const missionLink = STOREFRONT_HEADER_NAV.find((item) => item.href === "/mission");

  const desktopNavLinks = (
    <>
      {beforeMission.map((item) => (
        <Link key={item.href} href={item.href} className={NAV_LINK_CLASS}>
          {navLabel(item.href, item.label, labelOverrides)}
        </Link>
      ))}
      {missionLink ? (
        <Link href={missionLink.href} className={NAV_LINK_CLASS}>
          {navLabel(missionLink.href, missionLink.label, labelOverrides)}
        </Link>
      ) : null}
      {getInvolvedDropdownDesktop}
      {afterMission.map((item) => (
        <Link key={item.href} href={item.href} className={NAV_LINK_CLASS}>
          {navLabel(item.href, item.label, labelOverrides)}
        </Link>
      ))}
    </>
  );

  return (
    <header className="border-b border-white/30 sticky top-0 z-50 bg-brand-primary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between min-h-[4.5rem] md:min-h-[4.75rem] lg:min-h-20 py-3 md:py-2 gap-2 md:gap-3">
        <Link
          href="/"
          aria-label={`Home — ${siteName}`}
          className="flex items-center shrink-0 py-1 min-w-0"
        >
          <Image
            src="/logo/team-expansion.png"
            alt="Team Expansion"
            width={768}
            height={276}
            className="h-11 w-auto sm:h-12 md:h-[3rem] lg:h-[3.3rem] max-w-[min(100%,min(240px,58vw))] md:max-w-[min(100%,min(220px,32vw))] object-contain object-left drop-shadow-sm"
            priority
            unoptimized
          />
        </Link>

        <nav
          className={cn(
            DESKTOP_NAV_CLASS,
            "flex-1 items-center justify-center gap-x-2.5 md:gap-x-3 lg:gap-x-5 min-w-0 px-1 lg:px-3",
          )}
          aria-label="Primary"
        >
          {desktopNavLinks}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {giveNowButton}
          {MERCH_STORE_ENABLED ? (
            <>
              <span className={cn(DESKTOP_NAV_CLASS, "w-px h-4 bg-white/30 shrink-0")} aria-hidden />
              <CartLink
                subtle
                className={cn(DESKTOP_NAV_CLASS, "!text-white/75 hover:!text-white items-center")}
              />
            </>
          ) : null}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-white hover:bg-white/10 transition-colors"
            aria-expanded={mobileOpen}
            aria-controls={mobilePanelId}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id={mobilePanelId}
          className="md:hidden border-t border-white/20 bg-brand-primary/98 backdrop-blur-sm"
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1" aria-label="Mobile primary">
            {beforeMission.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
              >
                {navLabel(item.href, item.label, labelOverrides)}
              </Link>
            ))}
            {missionLink ? (
              <Link
                href={missionLink.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
              >
                {navLabel(missionLink.href, missionLink.label, labelOverrides)}
              </Link>
            ) : null}
            {getInvolvedAccordionMobile}
            {afterMission.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-white hover:bg-white/10"
              >
                {navLabel(item.href, item.label, labelOverrides)}
              </Link>
            ))}
            {MERCH_STORE_ENABLED ? (
              <div className="mt-3 pt-3 border-t border-white/20">
                <CartLink subtle className="!text-white/85 hover:!text-white px-3" />
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
