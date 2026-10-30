import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * Recruit records are ADMIN-only. The shared admin layout admits STAFF, so the page and every
 * server action must enforce requireAdminOnlySession themselves.
 */
const actionsPath = resolve(process.cwd(), "src/app/admin/recruits/actions.ts");
const ministryActionsPath = resolve(process.cwd(), "src/app/admin/recruits/ministry-actions.ts");
const legacyActionsPath = resolve(process.cwd(), "src/app/admin/recruits/legacy-actions.ts");
const initiativeActionsPath = resolve(process.cwd(), "src/app/admin/recruits/initiative-actions.ts");
const pagePath = resolve(process.cwd(), "src/app/admin/recruits/page.tsx");

const actions = readFileSync(actionsPath, "utf8");
const ministryActions = readFileSync(ministryActionsPath, "utf8");
const legacyActions = readFileSync(legacyActionsPath, "utf8");
const initiativeActions = readFileSync(initiativeActionsPath, "utf8");
const page = readFileSync(pagePath, "utf8");

describe("admin recruits guard", () => {
  it("page enforces ADMIN-only access and redirects otherwise", () => {
    expect(page).toContain("requireAdminOnlySession");
    expect(page).toContain("redirect(");
  });

  it("admin recruits page is force-dynamic", () => {
    expect(page).toContain('export const dynamic = "force-dynamic"');
  });

  it("every recruit server action requires an ADMIN-only session", () => {
    const exportedActions = [
      "createRecruitAction",
      "renameRecruitAction",
      "updateRecruitMilestonesAction",
      "deleteRecruitAction",
    ];

    for (const action of exportedActions) {
      expect(actions).toContain(action);
      // The guard must appear inside each action body, before any database work.
      const body = actions.slice(actions.indexOf(`export async function ${action}`));
      const guardAt = body.indexOf("requireAdminOnlySession");
      const nextExportAt = body.indexOf("export async function", 1);
      expect(guardAt).toBeGreaterThan(-1);
      if (nextExportAt > -1) expect(guardAt).toBeLessThan(nextExportAt);
    }
  });

  it("does not fall back to the ADMIN/STAFF combined helper", () => {
    expect(actions).not.toContain("requireAdminSession");
    expect(ministryActions).not.toContain("requireAdminSession");
    expect(legacyActions).not.toContain("requireAdminSession");
    expect(initiativeActions).not.toContain("requireAdminSession");
    expect(page).not.toContain("requireAdminSession(");
  });

  it("every ministry server action requires an ADMIN-only session", () => {
    const exportedActions = [
      "createMinistryPersonAction",
      "updateMinistryPersonAction",
      "updateMinistryMilestonesAction",
      "saveMinistryPersonAction",
      "deleteMinistryPersonAction",
      "createMinistryActivityAction",
      "updateMinistryActivityAction",
      "deleteMinistryActivityAction",
    ];

    const initiativeExportedActions = [
      "createNationalPartnerInitiativeAction",
      "updateNationalPartnerInitiativeAction",
      "deleteNationalPartnerInitiativeAction",
    ];

    for (const action of initiativeExportedActions) {
      const body = initiativeActions.slice(initiativeActions.indexOf(`export async function ${action}`));
      const guardAt = body.indexOf("requireAdminOnlySession");
      const nextExportAt = body.indexOf("export async function", 1);
      expect(guardAt).toBeGreaterThan(-1);
      if (nextExportAt > -1) expect(guardAt).toBeLessThan(nextExportAt);
    }

    for (const action of exportedActions) {
      const body = ministryActions.slice(ministryActions.indexOf(`export async function ${action}`));
      const guardAt = body.indexOf("requireAdminOnlySession");
      const nextExportAt = body.indexOf("export async function", 1);
      expect(guardAt).toBeGreaterThan(-1);
      if (nextExportAt > -1) expect(guardAt).toBeLessThan(nextExportAt);
    }
  });

  it("keeps the public homepage on the canonical ministry totals", () => {
    const renderPage = readFileSync(
      resolve(process.cwd(), "src/lib/site-builder/render-page.tsx"),
      "utf8",
    );
    const homePage = readFileSync(resolve(process.cwd(), "src/app/(storefront)/page.tsx"), "utf8");
    expect(renderPage).toContain("getMinistryOutcomeCounts");
    expect(renderPage).not.toContain("getRecruitCounts");
    expect(renderPage).toContain("noStore");
    expect(homePage).toContain('export const dynamic = "force-dynamic"');
    expect(renderPage).not.toContain("NationalPartnerInitiatives");
    expect(renderPage).not.toContain("ministry_national_partner_initiatives");
    expect(page).toContain("Legacy Recruit Tracker");
    expect(page).toContain("RecruitsManager");
    expect(page).toContain("LegacyReconciliation");
    const reconciliation = readFileSync(
      resolve(process.cwd(), "src/app/admin/recruits/legacy-reconciliation.tsx"),
      "utf8",
    );
    expect(reconciliation).toContain("Legacy Reconciliation");
    expect(renderPage).not.toContain("planLegacyImport");
  });

  it("keeps recruit queries in a server-only module", () => {
    const dbPath = resolve(process.cwd(), "src/lib/recruits/recruits-db.ts");
    const db = readFileSync(dbPath, "utf8");
    expect(db).toContain('import "server-only"');
  });

  it("exposes no public API route for recruits", () => {
    const apiDir = resolve(process.cwd(), "src/app/api");
    const found =
      existsSync(apiDir) &&
      readdirSync(apiDir).some((entry) => entry.toLowerCase().includes("recruit"));

    expect(found).toBe(false);
  });
});
