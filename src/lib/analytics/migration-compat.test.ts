import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("analytics migration backward compatibility", () => {
  it("adds nullable PageView columns without dropping legacy fields", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "prisma/migrations/20261103120000_privacy_conscious_analytics/migration.sql",
      ),
      "utf8",
    );
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "trafficClass"');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "sessionId"');
    expect(sql).not.toMatch(/DROP COLUMN/);
    expect(sql).not.toMatch(/DROP TABLE "PageView"/);
    expect(sql).toContain("analytics_sessions");
    expect(sql).toContain("analytics_events");
  });

  it("keeps PageView model fields intact in schema", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toMatch(/model PageView \{[\s\S]*visitorId String\?/);
    expect(schema).toMatch(/model PageView \{[\s\S]*trafficClass String\?/);
  });
});
