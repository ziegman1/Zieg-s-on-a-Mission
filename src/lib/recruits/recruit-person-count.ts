/**
 * How many people one recruit record represents.
 *
 * Couples and teams are entered as a single record — "Jeremy and Lindsay Ziegenhorn" — but count
 * as two people toward every milestone. Either "and" or "&" marks the join.
 *
 * "and" is matched on word boundaries so "Alexander", "Anderson", and "Sandra" stay one person.
 * Each additional join adds another person, so "Bob and Sue and Jim" is three.
 */
const JOIN_PATTERN = /\band\b|&/gi;

export function recruitPersonCount(name: string): number {
  const matches = name.match(JOIN_PATTERN);
  return (matches?.length ?? 0) + 1;
}

/** True when a record stands for more than one person, for admin display. */
export function isMultiPersonRecruit(name: string): boolean {
  return recruitPersonCount(name) > 1;
}
