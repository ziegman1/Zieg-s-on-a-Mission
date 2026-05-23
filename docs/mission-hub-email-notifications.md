# Mission Hub email notifications (Resend)

Circle-like notification emails for Mission Hub members. **Not Mail Suite** — Newsletter Builder remains the source of truth for newsletter content.

## Enable in production

1. Verify your domain in [Resend](https://resend.com).
2. Set environment variables (see `.env.example`):
   - `RESEND_API_KEY`
   - `MISSION_HUB_FROM_EMAIL`
   - `MISSION_HUB_FROM_NAME` (optional)
   - `MISSION_HUB_REPLY_TO_EMAIL` (optional)
   - `ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS=true`
3. Apply migration `20260608120000_mission_hub_email_deliveries` (`npm run db:migrate:deploy`).

## Newsletter publish

When a newsletter is published from Newsletter Builder:

- In-app notifications go to `community_notifications` (dedupe `newsletter:{id}:published`).
- Emails go to eligible members via Resend (dedupe `newsletter:{id}:email` per recipient in `mission_hub_email_deliveries`).

Eligibility: active Mission Hub member, newsletters + email channel on, Newsletter space not muted, not the publisher.

Republish does **not** resend email unless `resendNewsletterEmail` is passed (admin-only, future UI).

## Extending

- `notification_kind` on delivery log: `newsletter_published`, `new_post`, `weekly_digest`, `invitation`
- Shared send path: `src/lib/mission-hub/resend-client.ts`
- Dedupe helpers: `src/lib/mission-hub/email-dedupe.ts`
