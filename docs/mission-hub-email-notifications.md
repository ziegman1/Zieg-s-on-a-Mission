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

Republish does **not** resend email unless `resendNewsletterEmail` is passed (admin republish + smoke test).

## New post publish (all spaces)

When a **published** Mission Hub post is created (admin composer, member prayer room, etc.):

- In-app: dedupe `post:{postId}:published` in `community_notifications`
- Email: dedupe `post:{postId}:email` in `mission_hub_email_deliveries`, subject `New post in {spaceName}`

Skipped automatically for `sourceKind: newsletter` hub announcements (newsletter flow handles those).

Eligibility: active member, `newPosts` + channel on, space not muted, not the author.

## Smoke test (safe)

Set on Vercel or locally:

```bash
TEST_MISSION_HUB_EMAIL_RECIPIENTS=you@example.com
MISSION_HUB_EMAIL_DEBUG=1   # optional verbose logs
```

**CLI** (production DB via `.env.production`):

```bash
npm run smoke:mission-hub-newsletter:production -- <newsletterId>
```

**Admin UI:** Newsletter settings → Mission Hub delivery → **Run smoke test**

Behavior:

1. `removeNewsletterFromMissionHub()` — archives posts, clears dedupe logs  
2. Republish announcements + in-app notifications for all eligible members  
3. Email **only** to `TEST_MISSION_HUB_EMAIL_RECIPIENTS` (if unset, **no** broadcast email)

## Debugging

- `MISSION_HUB_EMAIL_DEBUG=1` — delivery counts, Resend message ids, skips  
- `NEWSLETTER_HUB_DEBUG=1` — newsletter fan-out logs  

## Extending

- `notification_kind` on delivery log: `newsletter_published`, `post_published`, `weekly_digest`, `invitation`
- Shared queue: `src/lib/mission-hub/email-delivery-queue.ts`
- Dedupe helpers: `src/lib/mission-hub/email-dedupe.ts`
