/**
 * Reviewed mapping from each legacy recruit row to individual people.
 *
 * Couple rows are written out by hand. Nothing in this file splits a name on
 * "and" or "&". A name that is not listed here is a discrepancy, not a new person.
 */

export type LegacyIndividualSpec = {
  individualKey: string;
  displayName: string;
  notes: string;
};

export type LegacySourceSpec = {
  sourceName: string;
  individuals: LegacyIndividualSpec[];
};

function single(sourceName: string, notes = ""): LegacySourceSpec {
  return {
    sourceName,
    individuals: [
      {
        individualKey: sourceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        displayName: sourceName,
        notes,
      },
    ],
  };
}

function couple(
  sourceName: string,
  first: LegacyIndividualSpec,
  second: LegacyIndividualSpec,
): LegacySourceSpec {
  return { sourceName, individuals: [first, second] };
}

export const LEGACY_IMPORT_SOURCES: readonly LegacySourceSpec[] = [
  single("Alys West"),
  single("Angela Quaye"),
  single("Ashley Stem"),
  couple(
    "Austin and Katherine Barr",
    { individualKey: "austin-barr", displayName: "Austin Barr", notes: "" },
    { individualKey: "katherine-barr", displayName: "Katherine Barr", notes: "" },
  ),
  single("Austin Zodrow"),
  single("Avonlea Blackburn"),
  single("Ben Hammack"),
  single("Beth Cunningham"),
  single("Brent Gough"),
  single("Brent Shaw"),
  single("Carson Wood"),
  couple(
    "Chris and Mary Clark",
    { individualKey: "chris-clark", displayName: "Chris Clark", notes: "" },
    { individualKey: "mary-clark", displayName: "Mary Clark", notes: "" },
  ),
  single("Darby M"),
  single("Erika Martin"),
  single("Faith Stapleton"),
  single("Jason Hunter"),
  couple(
    "Jay and Carolyn Wettstone",
    { individualKey: "jay-wettstone", displayName: "Jay Wettstone", notes: "" },
    { individualKey: "carolyn-wettstone", displayName: "Carolyn Wettstone", notes: "" },
  ),
  single("Jennifer Rehnberg"),
  couple(
    "Jody and Roger Wills",
    { individualKey: "jody-wills", displayName: "Jody Wills", notes: "" },
    { individualKey: "roger-wills", displayName: "Roger Wills", notes: "" },
  ),
  single("Karyn Austin"),
  single("Lianne Ong"),
  single("Luke (Cody's Team)", "Cody's Team"),
  single("Michael Hester"),
  single("Nissy Allison"),
  couple(
    "Peter and Elizabeth O'Conner",
    { individualKey: "peter-oconner", displayName: "Peter O'Conner", notes: "" },
    { individualKey: "elizabeth-oconner", displayName: "Elizabeth O'Conner", notes: "" },
  ),
  single("Ron Freisen"),
  single("Ryan Stapleton"),
  single("Steve Davis"),
  single("Tiffany (Cody's Team)", "Cody's Team"),
  single("Zach House"),
];

export const LEGACY_COUPLE_SOURCE_NAMES = LEGACY_IMPORT_SOURCES.filter(
  (source) => source.individuals.length > 1,
).map((source) => source.sourceName);
