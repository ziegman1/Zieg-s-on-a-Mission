import { describe, expect, it } from "vitest";
import { isMultiPersonRecruit, recruitPersonCount } from "./recruit-person-count";

describe("single people", () => {
  it("counts an ordinary name as one", () => {
    expect(recruitPersonCount("Ada Lovelace")).toBe(1);
  });

  it("counts an empty name as one", () => {
    expect(recruitPersonCount("")).toBe(1);
  });

  it("counts a single first name as one", () => {
    expect(recruitPersonCount("Grace")).toBe(1);
  });
});

describe("couples", () => {
  it("counts a couple joined by 'and' as two", () => {
    expect(recruitPersonCount("Jeremy and Lindsay Ziegenhorn")).toBe(2);
  });

  it("counts two full names joined by 'and' as two", () => {
    expect(recruitPersonCount("Ada Lovelace and Grace Hopper")).toBe(2);
  });

  it("is case-insensitive", () => {
    expect(recruitPersonCount("Jeremy AND Lindsay")).toBe(2);
    expect(recruitPersonCount("Jeremy And Lindsay")).toBe(2);
  });

  it("handles extra whitespace around the word", () => {
    expect(recruitPersonCount("Jeremy   and   Lindsay")).toBe(2);
  });
});

describe("ampersand as a join", () => {
  it("counts a couple joined by '&' as two", () => {
    expect(recruitPersonCount("Austin & Katherine Barr")).toBe(2);
  });

  it("counts '&' without surrounding spaces", () => {
    expect(recruitPersonCount("Austin&Katherine")).toBe(2);
  });

  it("mixes 'and' with '&'", () => {
    expect(recruitPersonCount("Bob and Sue & Jim")).toBe(3);
  });
});

describe("groups larger than two", () => {
  it("counts each additional join as another person", () => {
    expect(recruitPersonCount("Bob and Sue and Jim")).toBe(3);
    expect(recruitPersonCount("A and B and C and D")).toBe(4);
  });
});

describe("names that merely contain the letters a-n-d", () => {
  it("does not split Alexander", () => {
    expect(recruitPersonCount("Alexander Hamilton")).toBe(1);
  });

  it("does not split Anderson", () => {
    expect(recruitPersonCount("Andy Anderson")).toBe(1);
  });

  it("does not split Sandra or Randall", () => {
    expect(recruitPersonCount("Sandra Randall")).toBe(1);
  });

  it("does not split Amanda", () => {
    expect(recruitPersonCount("Amanda Sandoval")).toBe(1);
  });

  it("counts a real 'and' beside such a name correctly", () => {
    expect(recruitPersonCount("Alexander and Amanda")).toBe(2);
  });
});

describe("punctuation boundaries", () => {
  it("treats a comma-separated 'and' as a join", () => {
    expect(recruitPersonCount("Bob, Sue, and Jim")).toBe(2);
  });

  it("treats a hyphenated 'and' as a join", () => {
    expect(recruitPersonCount("Bob-and-Sue")).toBe(2);
  });
});

describe("isMultiPersonRecruit", () => {
  it("is false for a single person", () => {
    expect(isMultiPersonRecruit("Ada Lovelace")).toBe(false);
    expect(isMultiPersonRecruit("Alexander Hamilton")).toBe(false);
  });

  it("is true for a couple", () => {
    expect(isMultiPersonRecruit("Jeremy and Lindsay")).toBe(true);
  });
});
