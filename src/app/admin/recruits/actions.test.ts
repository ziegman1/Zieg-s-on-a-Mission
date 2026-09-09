import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    recruitRecord: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  createRecruitAction,
  deleteRecruitAction,
  renameRecruitAction,
  updateRecruitMilestonesAction,
} from "./actions";

type SessionLike = { user?: { id?: string; role?: string } } | null;
const mockedAuth = vi.mocked(auth as unknown as () => Promise<SessionLike>);

const recruits = vi.mocked(prisma.recruitRecord);

function signInAs(role: string) {
  mockedAuth.mockResolvedValue({ user: { id: "user-1", role } });
}

beforeEach(() => {
  vi.clearAllMocks();
  signInAs("ADMIN");
  // @ts-expect-error partial record is sufficient for these assertions
  recruits.create.mockResolvedValue({ id: "r1", name: "Ada Lovelace" });
  // @ts-expect-error partial record is sufficient for these assertions
  recruits.update.mockResolvedValue({ id: "r1", name: "Ada Lovelace" });
  // @ts-expect-error delete resolves to the removed row
  recruits.delete.mockResolvedValue({ id: "r1" });
});

describe("ADMIN authorization", () => {
  it("allows an ADMIN to create a recruit", async () => {
    await expect(createRecruitAction({ name: "Ada Lovelace" })).resolves.toEqual({ ok: true });
    expect(recruits.create).toHaveBeenCalledWith({ data: { name: "Ada Lovelace" } });
  });

  it("allows an ADMIN to update milestones, rename, and delete", async () => {
    await expect(
      updateRecruitMilestonesAction("r1", {
        jonathanTrainingComplete: true,
        fullyFunded: false,
      }),
    ).resolves.toEqual({ ok: true });
    await expect(renameRecruitAction("r1", { name: "Ada L." })).resolves.toEqual({ ok: true });
    await expect(deleteRecruitAction("r1")).resolves.toEqual({ ok: true });
  });
});

describe("STAFF denial", () => {
  beforeEach(() => signInAs("STAFF"));

  it("denies STAFF on create and never touches the database", async () => {
    const res = await createRecruitAction({ name: "Ada Lovelace" });

    expect(res).toEqual({ ok: false, error: "Unauthorized — recruit records are ADMIN-only." });
    expect(recruits.create).not.toHaveBeenCalled();
  });

  it("denies STAFF on milestone updates", async () => {
    const res = await updateRecruitMilestonesAction("r1", {
      jonathanTrainingComplete: true,
      fullyFunded: true,
    });

    expect(res.ok).toBe(false);
    expect(recruits.update).not.toHaveBeenCalled();
  });

  it("denies STAFF on rename", async () => {
    const res = await renameRecruitAction("r1", { name: "Nope" });

    expect(res.ok).toBe(false);
    expect(recruits.update).not.toHaveBeenCalled();
  });

  it("denies STAFF on delete", async () => {
    const res = await deleteRecruitAction("r1");

    expect(res.ok).toBe(false);
    expect(recruits.delete).not.toHaveBeenCalled();
  });
});

describe("other roles and anonymous visitors", () => {
  it("denies a CUSTOMER", async () => {
    signInAs("CUSTOMER");
    await expect(createRecruitAction({ name: "Ada" })).resolves.toEqual({
      ok: false,
      error: "Unauthorized — recruit records are ADMIN-only.",
    });
    expect(recruits.create).not.toHaveBeenCalled();
  });

  it("denies an unauthenticated visitor", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(deleteRecruitAction("r1")).resolves.toEqual({
      ok: false,
      error: "Unauthorized — recruit records are ADMIN-only.",
    });
    expect(recruits.delete).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("rejects an empty name without hitting the database", async () => {
    const res = await createRecruitAction({ name: "   " });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("Recruit name is required");
    expect(recruits.create).not.toHaveBeenCalled();
  });

  it("trims the name before saving", async () => {
    await createRecruitAction({ name: "  Ada Lovelace  " });

    expect(recruits.create).toHaveBeenCalledWith({ data: { name: "Ada Lovelace" } });
  });

  it("rejects a name beyond the column limit", async () => {
    const res = await createRecruitAction({ name: "a".repeat(121) });

    expect(res.ok).toBe(false);
    expect(recruits.create).not.toHaveBeenCalled();
  });

  it("rejects a missing recruit id", async () => {
    const res = await deleteRecruitAction("");

    expect(res).toEqual({ ok: false, error: "Missing recruit id." });
    expect(recruits.delete).not.toHaveBeenCalled();
  });

  it("rejects non-boolean milestone values", async () => {
    const res = await updateRecruitMilestonesAction("r1", {
      jonathanTrainingComplete: "yes" as unknown as boolean,
      fullyFunded: false,
    });

    expect(res.ok).toBe(false);
    expect(recruits.update).not.toHaveBeenCalled();
  });
});

describe("milestone persistence", () => {
  it("saves Fully Funded independently of training", async () => {
    await updateRecruitMilestonesAction("r1", {
      jonathanTrainingComplete: false,
      fullyFunded: true,
    });

    expect(recruits.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { jonathanTrainingComplete: false, fullyFunded: true },
    });
  });

  it("saves both milestones when a recruit becomes Sent", async () => {
    await updateRecruitMilestonesAction("r1", {
      jonathanTrainingComplete: true,
      fullyFunded: true,
    });

    expect(recruits.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { jonathanTrainingComplete: true, fullyFunded: true },
    });
  });
});

describe("database failures", () => {
  it("returns a friendly error when the create query throws", async () => {
    recruits.create.mockRejectedValueOnce(new Error("connection lost"));

    const res = await createRecruitAction({ name: "Ada Lovelace" });

    expect(res).toEqual({ ok: false, error: "Could not add that recruit." });
  });

  it("returns a friendly error when the delete query throws", async () => {
    recruits.delete.mockRejectedValueOnce(new Error("connection lost"));

    const res = await deleteRecruitAction("r1");

    expect(res).toEqual({ ok: false, error: "Could not delete that recruit." });
  });
});
