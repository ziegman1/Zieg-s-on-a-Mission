/**
 * Production-safe newsletter Mission Hub smoke test.
 *
 * Usage:
 *   TEST_MISSION_HUB_EMAIL_RECIPIENTS=you@example.com dotenv -e .env.production -- tsx scripts/smoke-mission-hub-newsletter.ts <newsletterId>
 *
 * Without TEST_MISSION_HUB_EMAIL_RECIPIENTS, in-app notifications still run but no emails are sent.
 */
import { runNewsletterMissionHubSmokeTest } from "../src/lib/mission-hub/smoke-test-newsletter-hub";

async function main() {
  const newsletterId = process.argv[2]?.trim();
  if (!newsletterId) {
    console.error("Usage: tsx scripts/smoke-mission-hub-newsletter.ts <newsletterId>");
    process.exit(1);
  }

  const result = await runNewsletterMissionHubSmokeTest({
    newsletterId,
    forceResendEmail: true,
  });

  console.log("\n--- Smoke test result ---\n");
  for (const line of result.logLines) {
    console.log(line);
  }

  if (!result.ok) {
    console.error("\nFailed:", result.error);
    process.exit(1);
  }

  console.log("\nOK — smoke test completed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
