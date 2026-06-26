/** Default copy and baseline numbers for the homepage Mission Counter section. */

export const MISSION_COUNTER_DISCLAIMER =
  "Estimates based on current population and missions research. Counters are calculated from configured daily rates and are not live census data.";

export const DEFAULT_MISSION_COUNTER_CONTENT = {
  headline: "The Number That Keeps Us Up At Night",
  body: `More than 70,000 people pass away every single day without ever having access to the gospel. Not 70,000 a year. A day.

The harvest was never the problem. Jesus said it plainly: the harvest is plentiful, the workers are few.

That's where we've aimed our lives. Not the shortage of need, but the shortage of trained, sent, fully funded workers to meet it.`,
  populationLabel: "World population",
  bornLabel: "Born today without gospel access",
  diedLabel: "Died today without gospel access",
  worldPopulationBaseline: "8100000000",
  worldPopulationBaselineAt: "2025-01-01T12:00:00.000Z",
  worldPopulationPerSecond: "2.3",
  bornWithoutAccessPerDay: "150000",
  dieWithoutAccessPerDay: "70000",
  sourceNote: MISSION_COUNTER_DISCLAIMER,
  sourceUrl: "https://joshuaproject.net",
} as const;
