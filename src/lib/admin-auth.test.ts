import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { requireAdmin, requireAdminOnlySession, requireAdminSession } from "./admin-auth";
import { isAdminOnlyRole, isAdminRole } from "./admin-users";

/** `auth` is an overloaded NextAuth handler; narrow it to the session call the guards make. */
type SessionLike = { user?: { id?: string; role?: string } } | null;
const mockedAuth = vi.mocked(auth as unknown as () => Promise<SessionLike>);

function sessionForRole(role: string): SessionLike {
  return { user: { id: "user-1", role } };
}

beforeEach(() => {
  mockedAuth.mockReset();
});

describe("isAdminOnlyRole", () => {
  it("admits ADMIN only", () => {
    expect(isAdminOnlyRole("ADMIN")).toBe(true);
  });

  it("denies STAFF", () => {
    expect(isAdminOnlyRole("STAFF")).toBe(false);
  });

  it("denies CUSTOMER and missing roles", () => {
    expect(isAdminOnlyRole("CUSTOMER")).toBe(false);
    expect(isAdminOnlyRole(null)).toBe(false);
    expect(isAdminOnlyRole(undefined)).toBe(false);
    expect(isAdminOnlyRole("")).toBe(false);
  });
});

describe("isAdminRole is unchanged for unrelated admin areas", () => {
  it("still admits both ADMIN and STAFF", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("STAFF")).toBe(true);
  });

  it("still denies CUSTOMER", () => {
    expect(isAdminRole("CUSTOMER")).toBe(false);
  });
});

describe("requireAdminOnlySession", () => {
  it("returns the session for an ADMIN user", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("ADMIN"));

    await expect(requireAdminOnlySession()).resolves.toEqual({
      id: "user-1",
      role: "ADMIN",
    });
  });

  it("denies a STAFF user", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("STAFF"));

    await expect(requireAdminOnlySession()).resolves.toBeNull();
  });

  it("denies a CUSTOMER user", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("CUSTOMER"));

    await expect(requireAdminOnlySession()).resolves.toBeNull();
  });

  it("denies an unauthenticated visitor", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    await expect(requireAdminOnlySession()).resolves.toBeNull();
  });

  it("denies a session with no user", async () => {
    mockedAuth.mockResolvedValueOnce({});

    await expect(requireAdminOnlySession()).resolves.toBeNull();
  });
});

describe("requireAdminSession keeps its existing ADMIN/STAFF behavior", () => {
  it("still admits STAFF so unrelated admin areas are unaffected", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("STAFF"));

    await expect(requireAdminSession()).resolves.toEqual({
      id: "user-1",
      role: "STAFF",
    });
  });

  it("still admits ADMIN", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("ADMIN"));

    await expect(requireAdminSession()).resolves.toEqual({
      id: "user-1",
      role: "ADMIN",
    });
  });

  it("denies CUSTOMER", async () => {
    mockedAuth.mockResolvedValueOnce(sessionForRole("CUSTOMER"));

    await expect(requireAdminSession()).resolves.toBeNull();
  });
});

describe("requireAdmin session predicate", () => {
  it("admits ADMIN and STAFF, denies others", () => {
    expect(requireAdmin({ user: { role: "ADMIN" } })).toBe(true);
    expect(requireAdmin({ user: { role: "STAFF" } })).toBe(true);
    expect(requireAdmin({ user: { role: "CUSTOMER" } })).toBe(false);
    expect(requireAdmin(null)).toBe(false);
  });
});
