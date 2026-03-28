export type HomeGuidedSectionRow = {
  id: string;
  href: string;
  title: string;
  body: string;
  ctaLabel: string;
  /** Optional section image (URL); shown in the wide column when set. */
  imageUrl: string;
};

/** Canonical homepage guided rows (id + href fixed; rest editable in admin). */
export const DEFAULT_HOME_GUIDED_SECTIONS: HomeGuidedSectionRow[] = [
  {
    id: "about",
    href: "/about",
    title: "About",
    body: "We’re Jeremy and our family — following Jesus into places and people we never expected. What started as a simple yes has grown into a journey of faith, relationships, and everyday moments where God is at work. There’s more to the story, and we’d love for you to be part of it.",
    ctaLabel: "Get to know us →",
    imageUrl: "",
  },
  {
    id: "mission",
    href: "/mission",
    title: "Mission",
    body: "In places where Christ is least known, something is beginning to move. Lives are changing, small communities of faith are forming, and the Gospel is taking root in ways we couldn’t have planned. This mission is bigger than us — and still unfolding.",
    ctaLabel: "Explore the mission →",
    imageUrl: "",
  },
  {
    id: "partner",
    href: "/partner",
    title: "Partner",
    body: "If you’ve ever wondered what it looks like to be part of something bigger than yourself — not just watching from a distance, but walking alongside it — there’s a place to explore that here. No pressure. Just an invitation to see what partnership really means.",
    ctaLabel: "See what partnership looks like →",
    imageUrl: "",
  },
  {
    id: "give",
    href: "/give",
    title: "Give",
    body: "Every step forward in this mission happens because people choose to be part of it. Whether it’s a one-time gift or something ongoing, each contribution helps us continue showing up where God is opening doors. No pressure — just a way to participate if and when it makes sense for you.",
    ctaLabel: "Make a gift →",
    imageUrl: "",
  },
  {
    id: "merch",
    href: "/merch",
    title: "Merch",
    body: "From time to time, we create simple items that reflect the mission — small, meaningful pieces that tell a bigger story. They’re not the focus, just a fun way to stay connected and carry the vision with you. Always optional. Always secondary to the mission.",
    ctaLabel: "Explore merch →",
    imageUrl: "",
  },
  {
    id: "blog",
    href: "/blog",
    title: "Blog",
    body: "Along the way, we share stories, updates, and reflections from what we’re seeing God do — the wins, the challenges, and everything in between. If you want to stay connected to the journey, this is the best place to start.",
    ctaLabel: "Read the latest →",
    imageUrl: "",
  },
  {
    id: "contact",
    href: "/contact",
    title: "Contact",
    body: "Whether you have questions, want to reach out, or just want to say hello — we’re real people on the other side of this and would love to hear from you. You don’t have to figure everything out before reaching out.",
    ctaLabel: "Reach out →",
    imageUrl: "",
  },
];

export type HomeGuided = {
  /** Full URL to hero background; empty uses bundled default image. */
  heroImageUrl: string;
  heroLearnMoreLabel: string;
  scrollBreakBody: string;
  closingBody: string;
  sections: HomeGuidedSectionRow[];
};

export const DEFAULT_HOME_HERO_IMAGE_PATH = "/images/hero-zieg-mission.png";

export const DEFAULT_HOME_SCROLL_BREAK =
  "You’re not just reading a story — you’re stepping into one.";

export const DEFAULT_HOME_CLOSING_BODY =
  "This mission is bigger than any one of us — but it’s built through people who choose to step in, one step at a time. Wherever you’re coming from, there’s a place for you here.";

export const DEFAULT_HOME_GUIDED: HomeGuided = {
  heroImageUrl: "",
  heroLearnMoreLabel: "Learn more",
  scrollBreakBody: DEFAULT_HOME_SCROLL_BREAK,
  closingBody: DEFAULT_HOME_CLOSING_BODY,
  sections: DEFAULT_HOME_GUIDED_SECTIONS,
};
