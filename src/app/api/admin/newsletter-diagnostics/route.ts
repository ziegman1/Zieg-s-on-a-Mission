import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  formatNewsletterDiagnosticsSummary,
  getNewsletterDatabaseDiagnostics,
} from "@/lib/newsletter/diagnostics";

export const runtime = "nodejs";

/** Admin-only newsletter DB readiness probe (no secrets). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics = await getNewsletterDatabaseDiagnostics();
  const ready =
    diagnostics.queryProbe === "ok" &&
    diagnostics.delegates.newsletter &&
    diagnostics.delegates.brandSettings &&
    diagnostics.missingColumns.newsletters.length === 0 &&
    diagnostics.missingColumns.newsletterBrandSettings.length === 0;

  return NextResponse.json({
    ready,
    summary: formatNewsletterDiagnosticsSummary(diagnostics),
    diagnostics,
  });
}
