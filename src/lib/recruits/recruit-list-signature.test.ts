import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { recruitListSignature, type RecruitListEntry } from "./recruit-list-signature";

function row(overrides: Partial<RecruitListEntry> = {}): RecruitListEntry {
  return {
    id: "r1",
    name: "Ada Lovelace",
    jonathanTrainingComplete: false,
    fullyFunded: false,
    ...overrides,
  };
}

/**
 * Regression guard. The admin table once kept the list captured on first mount, so adding a
 * recruit moved the summary counts while the table stayed empty — leaving no rows to click and
 * no way to mark anyone Trained or Sent.
 */
describe("recruitListSignature", () => {
  it("is stable for identical data in separate array instances", () => {
    expect(recruitListSignature([row()])).toBe(recruitListSignature([row()]));
  });

  it("is empty for an empty roster", () => {
    expect(recruitListSignature([])).toBe("");
  });

  it("changes when the first recruit is added", () => {
    expect(recruitListSignature([row()])).not.toBe(recruitListSignature([]));
  });

  it("changes when another recruit is added", () => {
    const before = recruitListSignature([row()]);
    const after = recruitListSignature([row(), row({ id: "r2", name: "Grace Hopper" })]);

    expect(after).not.toBe(before);
  });

  it("changes when a recruit is deleted", () => {
    const before = recruitListSignature([row(), row({ id: "r2", name: "Grace Hopper" })]);
    const after = recruitListSignature([row()]);

    expect(after).not.toBe(before);
  });

  it("changes when Jonathan Training is checked", () => {
    const before = recruitListSignature([row()]);
    const after = recruitListSignature([row({ jonathanTrainingComplete: true })]);

    expect(after).not.toBe(before);
  });

  it("changes when Fully Funded is checked", () => {
    const before = recruitListSignature([row()]);
    const after = recruitListSignature([row({ fullyFunded: true })]);

    expect(after).not.toBe(before);
  });

  it("changes when a recruit is renamed", () => {
    const before = recruitListSignature([row()]);
    const after = recruitListSignature([row({ name: "Ada L." })]);

    expect(after).not.toBe(before);
  });

  it("changes when recruits are reordered", () => {
    const a = row({ id: "r1", name: "Ada" });
    const b = row({ id: "r2", name: "Grace" });

    expect(recruitListSignature([a, b])).not.toBe(recruitListSignature([b, a]));
  });

  it("cannot collide when names contain separator characters", () => {
    const a = recruitListSignature([row({ id: "r1", name: "A" }), row({ id: "r2", name: "B" })]);
    const b = recruitListSignature([row({ id: "r1", name: "A,r2,B" })]);

    expect(a).not.toBe(b);
  });

  it("cannot collide when a name ends with the next recruit's id", () => {
    const a = recruitListSignature([row({ id: "ab", name: "c" })]);
    const b = recruitListSignature([row({ id: "a", name: "bc" })]);

    expect(a).not.toBe(b);
  });
});

describe("admin table adopts refreshed server data", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/admin/recruits/recruits-manager.tsx"),
    "utf8",
  );

  it("compares the incoming signature and resyncs", () => {
    expect(source).toContain("recruitListSignature(initialRecruits)");
    expect(source).toContain("if (incomingSignature !== syncedSignature)");
    expect(source).toContain("setRecruits(initialRecruits)");
  });

  it("refreshes after add, toggle, rename, and delete", () => {
    const refreshes = source.match(/router\.refresh\(\)/g) ?? [];
    expect(refreshes.length).toBeGreaterThanOrEqual(4);
  });

  it("renders a milestone checkbox for each recruit", () => {
    expect(source).toContain('type="checkbox"');
    expect(source).toContain('"jonathanTrainingComplete"');
    expect(source).toContain('"fullyFunded"');
  });
});
