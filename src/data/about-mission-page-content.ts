export type AboutMissionBodySection = {
  sectionKey: string;
  label: string;
  headline: string;
  body: string;
};

export const ABOUT_MISSION_PAGE_CONTENT = {
  hero: {
    eyebrow: "About & Mission",
    headline: "Sent to the field. Called back to send the next 300.",
    subheadline: "We're Jeremy and Lindsay Ziegenhorn.",
    body: "We serve with Team Expansion, and our work comes down to one thing. Raising, training, and sending the workers who will reach the people the gospel never has.",
    primaryCtaLabel: "Become a Monthly Partner",
    primaryCtaUrl: "/partner",
    secondaryCtaLabel: "Read our story below",
    secondaryCtaUrl: "#story",
  },
  bodySections: [
    {
      sectionKey: "story",
      label: "The call",
      headline: "The Call Most Believers Never Answer",
      body: `In 2012, something shifted for us. Through Scripture, prayer, and a few hard conversations, we started seeing the Great Commission for what it actually is. Not a nice idea for the spiritually ambitious. A command with a deadline.

We ran into a number we couldn't un-know. Billions of people still live with little or no access to the gospel, and thousands of people groups have no church able to reach their own.

Most believers hear that and move on with their week. We couldn't.

So we reordered our lives around it. Jeremy left construction. Lindsay left nursing. We pointed everything we had at the one assignment Jesus left His church and never took back.`,
    },
    {
      sectionKey: "what-that-decision-became",
      label: "What that decision became",
      headline: "What That Decision Became",
      body: `In 2015 we joined Team Expansion and started where we were, making disciples among international students in Central Illinois. Then we moved to Louisville for training in intercultural studies, missiology, and disciple-making movements.

In time we launched to Italy as a family. For four years we made disciples among Italians and internationals, with our daughters Zoe and Ava walking every step with us. Those years gave us something no classroom can. We learned what it actually costs to plant the gospel in hard soil, and what it takes to last.

At the end of 2021, God brought us back to the States to multiply it. Jeremy joined Team Expansion's training team, finished a Master of Arts in Catalytic Leadership, and began equipping the next wave of workers before they ever reach the field.

Today we serve on Team Expansion's International Services team. Jeremy is a Partnership Development Trainer and Coach, Director of Jonathan Training, and Director of D-Course, our immersive cross-cultural training, and he leads cohorts through Fidelis International Seminary. Lindsay serves as AWL-IN Coordinator, recruiting and mobilizing volunteers across the mission.

We've lived all three sides of this work. Local. Field. And training others to go. Very few people have done all three. That's exactly why we can take you from wherever you are and move you forward.`,
    },
    {
      sectionKey: "why-now",
      label: "Why now",
      headline: "Why Now",
      body: `Here's the number that keeps us up at night.

Around 104,000 people pass away every single day without ever having access to the gospel. Not 104,000 a year. A day.

The church isn't asleep. It's something harder to admit. Distracted and complacent. Busy and well-meaning, looking the other way while the clock runs.

The harvest was never the problem. Jesus said it plainly. The harvest is plentiful, the workers are few.

So that's where we've aimed our lives. Not the shortage of need. The shortage of trained, sent, fully funded workers to meet it.`,
    },
    {
      sectionKey: "what-we-believe",
      label: "What we believe",
      headline: "What We Believe",
      body: `A few convictions drive everything we do.

The Great Commission was never meant to stall in the hands of a few. Jesus didn't say "teach them everything I commanded." He said "teach them to obey everything I commanded." It is disciple-making you can only learn by doing, and it was entrusted to the whole church. Our job is to equip them to carry it.

We train to standard, not to time. As the saying goes, every Marine is a rifleman first. Nobody graduates simply because they went through a few weeks of training. We send them when they are genuinely ready to thrive on the field.

The sender is as vital as the one sent. No missionary goes alone. For every worker on the field, there are people praying, giving, and standing behind them so the work can move. We are not recruiting spectators, we are building the team that finishes the assignment.`,
    },
    {
      sectionKey: "what-we-do",
      label: "What we do",
      headline: "What We Do",
      body: `Everything we do fits into three words.

Mobilize. Through church partnerships, speaking, conferences, and personal mentoring, we help believers see the unreached clearly and find their place in reaching them.

Train. Through Jonathan Training, D-Course, disciple-making and church-planting principles, and leadership cohorts with Fidelis International Seminary, we build workers who will still be standing ten years in.

Send. Through partnership development coaching, we help workers build sustainable prayer and financial teams, so they launch strong and stay on the field for the long haul.`,
    },
    {
      sectionKey: "vision-300",
      label: "Vision 300",
      headline: "The Vision: 300 by 2031",
      body: `We are after one audacious thing.

To mobilize, train, and send 300 additional missionaries to the unreached peoples of the world by August 31, 2031.

This is one of the most ambitious sending goals in modern missions, and we mean to hit it. It will take churches willing to send, workers willing to go, and partners willing to stand behind them. Every person who prays, gives, or goes becomes part of those 300.

The assignment is finishable. We are building the people who will finish it. Maybe that includes you.`,
    },
  ] satisfies AboutMissionBodySection[],
  closingCta: {
    headline: "Where You Come In",
    body: "Wherever you're starting from, there's a place for you in this.",
    primaryCtaLabel: "Become a Monthly Partner",
    primaryCtaUrl: "/partner",
    secondaryCtaLabel: "Give once",
    secondaryCtaUrl: "/give",
    tertiaryCtaLabel: "Want to talk first? Reach out",
    tertiaryCtaUrl: "/contact",
  },
} as const;

export const ABOUT_MISSION_SECTION_KEYS = [
  "hero",
  ...ABOUT_MISSION_PAGE_CONTENT.bodySections.map((s) => s.sectionKey),
  "where-you-come-in",
] as const;
