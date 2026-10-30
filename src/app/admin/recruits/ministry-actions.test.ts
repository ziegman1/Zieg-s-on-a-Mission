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
  getMinistryPerson: vi.fn(),
  saveMinistryPersonChanges: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createMinistryActivity,
  createMinistryPerson,
  getMinistryPerson,
  saveMinistryPersonChanges,
} from "@/lib/ministry/ministry-db";
import {
  createMinistryActivityAction,
  createMinistryPersonAction,
  saveMinistryPersonAction,
  updateMinistryMilestonesAction,
} from "./ministry-actions";

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

  it("creates a Team Expansion Recruit through the person record, which records Mobilized", async () => {
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

const savedPerson = {
  id: "person-1",
  displayName: "Ada Lovelace",
  pathway: "TEAM_EXPANSION_RECRUIT" as const,
  legacyRecruitId: null,
  householdId: null,
  mobilized: false,
  mobilizedOn: null,
  trainedEquipped: false,
  trainedEquippedOn: null,
  sent: false,
  sentOn: null,
  sentDesignation: null,
  sentVerifiedAt: null,
  sentVerifiedBy: "",
  sentVerificationNote: "",
  notes: "",
  jonathanTrainingComplete: false,
  fullyFunded: false,
  milestoneAudit: "",
  activities: [],
};

const saveInput = {
  displayName: "Ada Lovelace",
  pathway: "TEAM_EXPANSION_RECRUIT",
  notes: "notes",
  householdWithPersonId: "",
  legacyRecruitId: "",
  jonathanTrainingComplete: true,
  fullyFunded: true,
  confirmHistoryChange: false,
  mobilized: true,
  mobilizedOn: "",
  trainedEquipped: true,
  trainedEquippedOn: "",
  sent: true,
  sentOn: "",
  sentDesignation: "NATIONAL_WORKER",
  sentVerifiedBy: "",
  sentVerificationNote: "",
};

describe("saveMinistryPersonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    vi.mocked(getMinistryPerson).mockResolvedValue(savedPerson);
    vi.mocked(saveMinistryPersonChanges).mockResolvedValue(savedPerson);
  });

  it("rejects an invalid person before writing", async () => {
    const result = await saveMinistryPersonAction("person-1", { ...saveInput, displayName: " " });
    expect(result.ok).toBe(false);
    expect(saveMinistryPersonChanges).not.toHaveBeenCalled();
    expect(getMinistryPerson).not.toHaveBeenCalled();
  });

  it("does not write when Team Expansion Recruit Sent has no designation", async () => {
    const result = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      sentDesignation: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.needsConfirmation).not.toBe(true);
    expect(saveMinistryPersonChanges).not.toHaveBeenCalled();
  });

  it("does not write when turning Sent off still needs confirmation", async () => {
    vi.mocked(getMinistryPerson).mockResolvedValue({
      ...savedPerson,
      mobilized: true,
      sent: true,
      sentDesignation: "D_COURSE",
      sentOn: "2020-01-02",
      jonathanTrainingComplete: true,
      fullyFunded: true,
    });
    const result = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      jonathanTrainingComplete: false,
      fullyFunded: false,
      sent: false,
      sentDesignation: "D_COURSE",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.needsConfirmation).toBe(true);
    expect(saveMinistryPersonChanges).not.toHaveBeenCalled();
  });

  it("writes profile and milestones through one save", async () => {
    const result = await saveMinistryPersonAction("person-1", saveInput);
    expect(result.ok).toBe(true);
    expect(saveMinistryPersonChanges).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/recruits");
  });

  it("keeps a National Partner Sent flag independent of training and funding", async () => {
    vi.mocked(getMinistryPerson).mockResolvedValue({
      ...savedPerson,
      pathway: "NATIONAL_PARTNER",
    });
    const result = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      pathway: "NATIONAL_PARTNER",
      jonathanTrainingComplete: true,
      fullyFunded: true,
      mobilized: false,
      trainedEquipped: false,
      sent: true,
      sentDesignation: "OTHER_DISCIPLE_MAKER",
    });
    expect(result.ok).toBe(true);
    expect(saveMinistryPersonChanges).toHaveBeenCalledOnce();
    const submission = vi.mocked(saveMinistryPersonChanges).mock.calls[0][1].submission;
    expect(submission.pathway).toBe("NATIONAL_PARTNER");
    expect(submission.sent).toBe(true);
    expect(submission.trainedEquipped).toBe(false);
    expect(submission.mobilized).toBe(false);
  });

  it("rejects an incomplete activity before writing and keeps the pathway save independent of Fidelis", async () => {
    const invalid = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      activityCreate: {
        activityType: "JONATHAN_TRAINING",
        status: "PARTICIPATED",
        activityOn: "not-a-date",
        location: "Hall",
        notes: "",
      },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error).toContain("Date, if known");
    expect(saveMinistryPersonChanges).not.toHaveBeenCalled();

    const result = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      pathway: "NATIONAL_PARTNER",
      mobilized: false,
      trainedEquipped: false,
      sent: false,
      sentDesignation: "",
      activityCreate: {
        activityType: "FIDELIS",
        status: "COMPLETED",
        activityOn: "",
        location: "Hall",
        notes: "",
      },
    });
    expect(result.ok).toBe(true);
    const saved = vi.mocked(saveMinistryPersonChanges).mock.calls[0][1];
    expect(saved.pathway).toBe("NATIONAL_PARTNER");
    expect(saved.submission.sent).toBe(false);
    expect(saved.submission.mobilized).toBe(false);
    expect(saved.activities?.create?.activityType).toBe("FIDELIS");
  });

  it("saves a Launch activity without changing pathway or milestone flags", async () => {
    const result = await saveMinistryPersonAction("person-1", {
      ...saveInput,
      pathway: "NATIONAL_PARTNER",
      jonathanTrainingComplete: false,
      fullyFunded: false,
      mobilized: false,
      trainedEquipped: false,
      sent: false,
      sentDesignation: "",
      activityCreate: {
        activityType: "LAUNCH",
        status: "COMPLETED",
        activityOn: "2026-04-01",
        location: "Emerald Hills",
        notes: "departure notes",
      },
    });
    expect(result.ok).toBe(true);
    const saved = vi.mocked(saveMinistryPersonChanges).mock.calls[0][1];
    expect(saved.pathway).toBe("NATIONAL_PARTNER");
    expect(saved.submission.mobilized).toBe(false);
    expect(saved.submission.trainedEquipped).toBe(false);
    expect(saved.submission.sent).toBe(false);
    expect(saved.activities?.create).toMatchObject({
      activityType: "LAUNCH",
      status: "COMPLETED",
      activityOn: "2026-04-01",
      location: "Emerald Hills",
      notes: "departure notes",
    });
  });

  it("reports a database failure without refreshing the list", async () => {
    vi.mocked(saveMinistryPersonChanges).mockRejectedValue(new Error("db down"));
    const result = await saveMinistryPersonAction("person-1", saveInput);
    expect(result.ok).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
