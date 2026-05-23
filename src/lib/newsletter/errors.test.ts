import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { formatNewsletterError } from "./errors";

describe("formatNewsletterError", () => {
  it("preserves Newsletters table is missing instead of generic message", () => {
    const err = new Error(
      "Newsletters table is missing. Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.",
    );
    const formatted = formatNewsletterError(err);
    expect(formatted).toContain("Newsletters table is missing");
    expect(formatted).not.toBe("Newsletter database is not ready.");
  });

  it("preserves Prisma client not ready message", () => {
    const err = new Error(
      "Newsletter Prisma client is not ready. Run npx prisma generate and restart the dev server.",
    );
    expect(formatNewsletterError(err)).toContain("Newsletter Prisma client is not ready");
  });

  it("describes missing column for P2022", () => {
    const err = new Prisma.PrismaClientKnownRequestError("column missing", {
      code: "P2022",
      clientVersion: "6.9.0",
      meta: { column: "cta_align" },
    });
    expect(formatNewsletterError(err)).toContain('column "cta_align" is missing');
  });
});
