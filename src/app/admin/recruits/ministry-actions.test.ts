import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ministry/ministry-db", () => ({
  createMinistryPerson: vi.fn(),
  updateMinistryPerson: vi.fn(),
  updateMinistryMilestones: vi.fn(),
  deleteMinistryPerson: vi.fn(),
  createMinistryActivity: vi.fn(),
  updateMinistryActivity: vi.fn(),
  deleteMinistryActivity: vi.fn(),
  setMinistryHousehold: vi.fn(),
}));

import { auth } from "@/auth";
import { createMinistryActivity, createMinistryPerson } from "@/lib/ministry/ministry-db";
import { createMinistryActivityAction, createMinistryPersonAction, updateMinistryMilestonesAction } from "./ministry-actions";

type SessionLike = { user?: { id?: string; role?: string } } | null;
const mockedAuth = vi.mocked(auth as unknown as () => Promise<SessionLike>);

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  vi.mocked(createMinistryPerson).mockResolvedValue({} as never);
  vi.mocked(createMinistryActivity).mockResolvedValue(undefined);
});

describe("ministry action authorization", () => {
  it("rejects STAFF", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "staff-1", role: "STAFF" } });
    const result = await createMinistryPersonAction({
      displayName: "Ada",
      pathway: "",
      notes: "",
    });
    expect(result.ok).toBe(false);
    expect(createMinistryPerson).not.toHaveBeenCalled();
  });

  it("creates a person without confirming any milestone", async () => {
    const result = await createMinistryPersonAction({
      displayName: "Ada Lovelace",
      pathway: "TEAM_EXPANSION_RECRUIT",
      notes: "",
    });
    expect(result.ok).toBe(true);
    expect(createMinistryPerson).toHaveBeenCalledWith({
      displayName: "Ada Lovelace",
      pathway: "TEAM_EXPANSION_RECRUIT",
      notes: "",
    });
  });

  it("does not save Sent without a designation", async () => {
    const result = await updateMinistryMilestonesAction("person-1", {
      mobilized: false,
      mobilizedOn: "",
      trainedEquipped: false,
      trainedEquippedOn: "",
      sent: true,
      sentOn: "",
      sentDesignation: "",
      sentVerifiedBy: "",
      sentVerificationNote: "",
    });
    expect(result.ok).toBe(false);
  });

  it("adding a completed activity does not go through milestone updates", async () => {
    const result = await createMinistryActivityAction("person-1", {
      activityType: "FIDELIS",
      status: "COMPLETED",
      activityOn: "",
      location: "",
      notes: "",
    });
    expect(result.ok).toBe(true);
    expect(createMinistryActivity).toHaveBeenCalledOnce();
  });
});
