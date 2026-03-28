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
    body: "We’re Jeremy and our family — following Jesus into places and people we never expected. What started as a simple yes has grown into a journey of faith, relationships, and everyday moments where God is at work. There’s more to the story, and we’d love for you to be part of it.",
    ctaLabel: "Get to know us →",
    href: "/about",
  },
  {
    id: "mission",
    title: "Mission",
    body: "In places where Christ is least known, something is beginning to move. Lives are changing, small communities of faith are forming, and the Gospel is taking root in ways we couldn’t have planned. This mission is bigger than us — and still unfolding.",
    ctaLabel: "Explore the mission →",
    href: "/mission",
  },
  {
    id: "partner",
    title: "Partner",
    body: "If you’ve ever wondered what it looks like to be part of something bigger than yourself — not just watching from a distance, but walking alongside it — there’s a place to explore that here. No pressure. Just an invitation to see what partnership really means.",
    ctaLabel: "See what partnership looks like →",
    href: "/partner",
  },
  {
    id: "give",
    title: "Give",
    body: "Every step forward in this mission happens because people choose to be part of it. Whether it’s a one-time gift or something ongoing, each contribution helps us continue showing up where God is opening doors. No pressure — just a way to participate if and when it makes sense for you.",
    ctaLabel: "Make a gift →",
    href: "/give",
  },
  {
    id: "merch",
    title: "Merch",
    body: "From time to time, we create simple items that reflect the mission — small, meaningful pieces that tell a bigger story. They’re not the focus, just a fun way to stay connected and carry the vision with you. Always optional. Always secondary to the mission.",
    ctaLabel: "Explore merch →",
    href: "/merch",
  },
  {
    id: "blog",
    title: "Blog",
    body: "Along the way, we share stories, updates, and reflections from what we’re seeing God do — the wins, the challenges, and everything in between. If you want to stay connected to the journey, this is the best place to start.",
    ctaLabel: "Read the latest →",
    href: "/blog",
  },
  {
    id: "contact",
    title: "Contact",
    body: "Whether you have questions, want to reach out, or just want to say hello — we’re real people on the other side of this and would love to hear from you. You don’t have to figure everything out before reaching out.",
    ctaLabel: "Reach out →",
    href: "/contact",
  },
];

export const GUIDED_HOME_CLOSING = {
  body: "This mission is bigger than any one of us — but it’s built through people who choose to step in, one step at a time. Wherever you’re coming from, there’s a place for you here.",
} as const;
