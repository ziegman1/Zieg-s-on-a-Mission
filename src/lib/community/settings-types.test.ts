import { describe, expect, it } from "vitest";
import {
  DEFAULT_HUB_INVITATION,
  formatHubSettingsValidationError,
  hubSettingsValidationIssues,
  isPlaceholderHubImageUrl,
  normalizeHubSettingsInput,
  parseUpdateHubSettingsInput,
  updateHubSettingsSchema,
} from "./settings-types";

const WELCOME_POST_PATH =
  "/community/start-here#post-9d28934d-c2c5-44f4-af87-2df5a789807c";

const INVITATION_BODY = DEFAULT_HUB_INVITATION.body;

/** Raw client state as submitted by production settings-hub-panel before fixes. */
const PRODUCTION_CLIENT_PAYLOAD = {
  title: "Mission Hub",
  tagline: "Ministry family",
  logoUrl: null,
  coverImageUrl: null,
  welcomeText: null,
  invitationTitle: DEFAULT_HUB_INVITATION.title,
  invitationBody: INVITATION_BODY,
  welcomePostPath: WELCOME_POST_PATH,
};

describe("hub settings validation", () => {
  it("documents the production failure: null optional fields rejected by legacy schema", () => {
    const legacySchema = {
      safeParse(input: typeof PRODUCTION_CLIENT_PAYLOAD) {
        const { z } = require("zod") as typeof import("zod");
        return z
          .object({
            title: z.string().max(120).optional().or(z.literal("")),
            tagline: z.string().max(200).optional().or(z.literal("")),
            logoUrl: z.string().url().max(2000).optional().or(z.literal("")),
            coverImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
            welcomeText: z.string().max(2000).optional().or(z.literal("")),
            invitationTitle: z.string().max(160).optional().or(z.literal("")),
            invitationBody: z.string().max(2000).optional().or(z.literal("")),
            welcomePostPath: z.string().max(500).optional().or(z.literal("")),
          })
          .safeParse(input);
      },
    };

    const parsed = legacySchema.safeParse(PRODUCTION_CLIENT_PAYLOAD);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.map((issue) => issue.path[0])).toEqual([
      "logoUrl",
      "coverImageUrl",
      "welcomeText",
    ]);
    expect(parsed.error.issues[0]?.message).toBe("Invalid input");
  });

  it("accepts the production client payload via schema preprocess", () => {
    const parsed = updateHubSettingsSchema.safeParse(PRODUCTION_CLIENT_PAYLOAD);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.logoUrl).toBe("");
    expect(parsed.data.coverImageUrl).toBe("");
    expect(parsed.data.welcomeText).toBe("");
    expect(parsed.data.welcomePostPath).toBe(WELCOME_POST_PATH);
  });
  it("normalizes null optional fields to empty strings", () => {
    expect(
      normalizeHubSettingsInput({
        title: null,
        tagline: null,
        logoUrl: null,
        coverImageUrl: null,
        welcomeText: null,
        welcomePostPath: null,
        invitationTitle: null,
        invitationBody: null,
      }),
    ).toEqual({
      title: "",
      tagline: "",
      logoUrl: "",
      coverImageUrl: "",
      welcomeText: "",
      welcomePostPath: "",
      invitationTitle: "",
      invitationBody: "",
    });
  });

  it("validates and saves when optional fields are null after normalization", () => {
    const parsed = parseUpdateHubSettingsInput({
      title: null,
      tagline: null,
      logoUrl: null,
      coverImageUrl: null,
      welcomeText: null,
      invitationTitle: "Join Us in God's Mission",
      invitationBody: INVITATION_BODY,
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.welcomePostPath).toBe(WELCOME_POST_PATH);
  });

  it("passes with empty logoUrl and coverImageUrl", () => {
    const parsed = parseUpdateHubSettingsInput({
      title: "Mission Hub",
      tagline: "Ministry family",
      logoUrl: "",
      coverImageUrl: "",
      welcomeText: "",
      invitationTitle: "Join Us in God's Mission",
      invitationBody: INVITATION_BODY,
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
  });

  it("normalizes UI placeholder image URLs to empty strings", () => {
    expect(isPlaceholderHubImageUrl("https://…")).toBe(true);
    expect(isPlaceholderHubImageUrl("https://...")).toBe(true);

    expect(
      normalizeHubSettingsInput({
        logoUrl: "https://…",
        coverImageUrl: "https://...",
      }),
    ).toEqual(
      expect.objectContaining({
        logoUrl: "",
        coverImageUrl: "",
      }),
    );
  });

  it("validates the reported admin form payload after normalization", () => {
    const parsed = parseUpdateHubSettingsInput({
      title: "Mission Hub",
      tagline: "Ministry family",
      logoUrl: "https://…",
      coverImageUrl: null,
      welcomeText: "",
      invitationTitle: "Join Us in God's Mission",
      invitationBody: INVITATION_BODY,
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.logoUrl).toBe("");
    expect(parsed.data.coverImageUrl).toBe("");
    expect(parsed.data.welcomePostPath).toBe(WELCOME_POST_PATH);
  });

  it("normalizes whitespace-only image URLs to empty strings", () => {
    const parsed = parseUpdateHubSettingsInput({
      logoUrl: " ",
      coverImageUrl: "  ",
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.logoUrl).toBe("");
    expect(parsed.data.coverImageUrl).toBe("");
  });

  it("rejects invalid real image URLs after normalization", () => {
    const parsed = parseUpdateHubSettingsInput({
      title: "",
      tagline: "",
      logoUrl: "not-a-url",
      coverImageUrl: "",
      welcomeText: "",
      invitationTitle: "",
      invitationBody: "",
      welcomePostPath: "",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((i) => i.path[0] === "logoUrl")).toBe(true);
    expect(
      hubSettingsValidationIssues(parsed.error, { logoUrl: "not-a-url" }),
    ).toEqual([
      expect.objectContaining({
        path: "logoUrl",
        message: "Invalid url",
        received: "not-a-url",
      }),
    ]);
    expect(formatHubSettingsValidationError(parsed.error, { logoUrl: "not-a-url" })).toMatch(
      /logoUrl:/,
    );
  });

  it("accepts valid image URLs", () => {
    const parsed = updateHubSettingsSchema.safeParse(
      normalizeHubSettingsInput({
        logoUrl: "https://example.com/logo.png",
        coverImageUrl: "https://example.com/cover.jpg",
      }),
    );

    expect(parsed.success).toBe(true);
  });

  it("accepts welcomePostPath with #post-{uuid} hash", () => {
    const parsed = parseUpdateHubSettingsInput({
      welcomePostPath: WELCOME_POST_PATH,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.welcomePostPath).toBe(WELCOME_POST_PATH);
  });
});
