import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockGetPrismaClient = vi.fn();
const mockResetPrismaClient = vi.fn();

vi.mock("@/lib/db", () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  resetPrismaClient: () => mockResetPrismaClient(),
}));

import {
  getNewsletterBrandSettingsDelegate,
  runNewsletterBrandSettingsQuery,
} from "./prisma-brand-settings";

function mockClient(withDelegate: boolean) {
  return {
    newsletterBrandSettingsRecord: withDelegate
      ? { findUnique: mockFindUnique, create: vi.fn(), update: vi.fn() }
      : undefined,
  };
}

describe("getNewsletterBrandSettingsDelegate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrismaClient.mockReturnValue(mockClient(true));
  });

  it("returns delegate when prisma client is generated", () => {
    const delegate = getNewsletterBrandSettingsDelegate();
    expect(delegate).toBeTruthy();
    expect(typeof delegate?.findUnique).toBe("function");
  });

  it("resets prisma and retries when delegate is missing on first attempt", () => {
    mockGetPrismaClient
      .mockReturnValueOnce(mockClient(false))
      .mockReturnValueOnce(mockClient(true));

    const delegate = getNewsletterBrandSettingsDelegate();
    expect(mockResetPrismaClient).toHaveBeenCalled();
    expect(delegate).toBeTruthy();
  });

  it("runNewsletterBrandSettingsQuery throws when delegate stays unavailable", async () => {
    mockGetPrismaClient.mockReturnValue(mockClient(false));

    await expect(
      runNewsletterBrandSettingsQuery((d) => d.findUnique({ where: { id: "default" } })),
    ).rejects.toThrow(/branding Prisma client is not ready/i);
  });
});
