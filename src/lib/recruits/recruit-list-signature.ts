/** Fields that make one server-rendered recruit list distinguishable from another. */
export type RecruitListEntry = {
  id: string;
  name: string;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
};

/**
 * Identity of a recruit list, so the admin table can tell a genuine server refresh from a
 * re-render with a new array reference.
 *
 * `router.refresh()` re-runs the server component but does not reset `useState`, so the table
 * compares this signature to decide when to adopt the server's data. Without it the table would
 * keep rendering the list captured on first mount while the summary counts moved on.
 *
 * Fields are length-prefixed so no combination of names and ids can collide.
 */
export function recruitListSignature(recruits: RecruitListEntry[]): string {
  return recruits
    .map((r) =>
      [r.id, r.name, r.jonathanTrainingComplete, r.fullyFunded]
        .map((part) => {
          const value = String(part);
          return `${value.length}:${value}`;
        })
        .join(","),
    )
    .join("|");
}
