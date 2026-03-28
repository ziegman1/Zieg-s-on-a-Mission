/**
 * Homepage sections below the hero — guided entry to primary nav destinations.
 * Static copy; no database.
 */

export type GuidedHomeSection = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
};

export const GUIDED_HOME_SECTIONS: GuidedHomeSection[] = [
  {
    id: "about",
    title: "About",
    body: "We’re Jeremy and our family — ordinary people who love Jesus and believe he’s at work in everyday life and across the world. We’d love for you to get to know us, too.",
    ctaLabel: "Get to know us →",
    href: "/about",
  },
  {
    id: "mission",
    title: "Mission",
    body: "God is opening doors for disciples to be made and churches to be planted where Christ is least known. There’s more to the story — we’d love to show you what’s stirring our hearts.",
    ctaLabel: "Explore the mission →",
    href: "/mission",
  },
  {
    id: "partner",
    title: "Partner",
    body: "If you’re curious what walking alongside this work could look like — without pressure — there’s a place here to explore that together.",
    ctaLabel: "See what partnership looks like →",
    href: "/partner",
  },
  {
    id: "give",
    title: "Give",
    body: "Whether it’s a one-time gift or something ongoing, every bit helps us keep showing up where God leads. No guilt, no hoops — just a way to take part if it fits.",
    ctaLabel: "Make a gift →",
    href: "/give",
  },
  {
    id: "merch",
    title: "Merch",
    body: "From time to time we share shirts, stickers, and little things that celebrate the mission — optional, fun, and always secondary to the deeper work.",
    ctaLabel: "Explore merch →",
    href: "/merch",
  },
  {
    id: "blog",
    title: "Blog",
    body: "Honest updates, stories from the field, and things we’re learning along the way — a simple way to stay connected between hellos.",
    ctaLabel: "Read the latest →",
    href: "/blog",
  },
  {
    id: "contact",
    title: "Contact",
    body: "Questions, prayer requests, or just want to say hi? We’re real people on the other side of this screen — write anytime.",
    ctaLabel: "Reach out →",
    href: "/contact",
  },
];

export const GUIDED_HOME_CLOSING = {
  body: "Wherever you land first, we’re glad you’re here. This mission is bigger than any one of us — and there’s room in the story for you.",
} as const;
