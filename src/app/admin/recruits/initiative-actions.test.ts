import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ministry/national-partner-initiatives-db", () => ({
  createNationalPartnerInitiative: vi.fn(),
  updateNationalPartnerInitiative: vi.fn(),
  deleteNationalPartnerInitiative: vi.fn(),
}));

import { auth } from "@/auth";
import {
  createNationalPartnerInitiative,
  deleteNationalPartnerInitiative,
  updateNationalPartnerInitiative,
} from "@/lib/ministry/national-partner-initiatives-db";
import {
  createNationalPartnerInitiativeAction,
  deleteNationalPartnerInitiativeAction,
  updateNationalPartnerInitiativeAction,
} from "./initiative-actions";

type SessionLike = { user?: { id?: string; role?: string } } | null;
const mockedAuth = vi.mocked(auth as unknown as () => Promise<SessionLike>);

const input = {
  nation: "Kenya",
  area: "Rift Valley",
  trainingType: "MEDICAL_TRAINING",
  completedCount: "40",
  submissionKey: "11111111-1111-4111-8111-111111111111",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  vi.mocked(createNationalPartnerInitiative).mockResolvedValue({
    id: "initiative-1",
    nation: "Kenya",
    area: "Rift Valley",
    trainingType: "MEDICAL_TRAINING",
    completedCount: 40,
  });
});

describe("national partner initiative actions", () => {
  it("rejects STAFF before writing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "staff-1", role: "STAFF" } });
    const result = await createNationalPartnerInitiativeAction(input);
    expect(result.ok).toBe(false);
    expect(createNationalPartnerInitiative).not.toHaveBeenCalled();
  });

  it("rejects an invalid count and an unapproved training type before writing", async () => {
    const negative = await createNationalPartnerInitiativeAction({ ...input, completedCount: "-2" });
    expect(negative.ok).toBe(false);
    if (!negative.ok) expect(negative.error).toContain("Number completed");

    const launch = await createNationalPartnerInitiativeAction({ ...input, trainingType: "LAUNCH" });
    expect(launch.ok).toBe(false);
    if (!launch.ok) expect(launch.error).toContain("Training type");
    expect(createNationalPartnerInitiative).not.toHaveBeenCalled();
  });

  it("saves one valid initiative for an admin", async () => {
    const result = await createNationalPartnerInitiativeAction(input);
    expect(result.ok).toBe(true);
    expect(createNationalPartnerInitiative).toHaveBeenCalledWith({
      nation: "Kenya",
      area: "Rift Valley",
      trainingType: "MEDICAL_TRAINING",
      completedCount: 40,
      submissionKey: input.submissionKey,
    });
  });

  it("saves an edited count on the same initiative", async () => {
    vi.mocked(updateNationalPartnerInitiative).mockResolvedValue({
      id: "initiative-1",
      nation: "Kenya",
      area: "Rift Valley",
      trainingType: "FOUR_FIELDS",
      completedCount: 25,
    });
    const result = await updateNationalPartnerInitiativeAction("initiative-1", {
      ...input,
      trainingType: "FOUR_FIELDS",
      completedCount: "25",
    });
    expect(result.ok).toBe(true);
    expect(updateNationalPartnerInitiative).toHaveBeenCalledWith("initiative-1", {
      nation: "Kenya",
      area: "Rift Valley",
      trainingType: "FOUR_FIELDS",
      completedCount: 25,
    });
    expect(createNationalPartnerInitiative).not.toHaveBeenCalled();
  });

  it("does not remove an initiative for STAFF", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "staff-1", role: "STAFF" } });
    const result = await deleteNationalPartnerInitiativeAction("initiative-1");
    expect(result.ok).toBe(false);
    expect(deleteNationalPartnerInitiative).not.toHaveBeenCalled();
  });
});
