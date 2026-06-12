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

## Weekly digest (Saturday cron)

Scheduled **“This Week in Mission Hub”** email for eligible members. Manual preview/test/send remains on **`/admin/community`**.

### Required env vars (production)

| Variable | Purpose |
|----------|---------|
| `ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS=true` | Master email feature flag |
| `MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED=true` | Enable scheduled Saturday send |
| `CRON_SECRET` | Protects `/api/cron/mission-hub-weekly-digest` (Vercel sends `Authorization: Bearer …`) |
| `RESEND_API_KEY` | Resend API |
| `MISSION_HUB_FROM_EMAIL` | From address |
| `MISSION_HUB_REPLY_TO_EMAIL` | Reply-to (recommended) |

### Cron endpoint

- **Path:** `GET /api/cron/mission-hub-weekly-digest`
- **Config:** `vercel.json` → `"schedule": "0 12 * * 6"` (**Saturday 12:00 UTC**)

### Schedule & DST

Vercel Cron uses a fixed UTC time (no automatic DST shift):

| US Eastern | Local delivery time |
|------------|---------------------|
| **EDT** (Mar–Nov) | **8:00 AM** at 12:00 UTC |
| **EST** (Nov–Mar) | **7:00 AM** at 12:00 UTC |

To target **8:00 AM EST** instead (9:00 AM during EDT), change the schedule to `0 13 * * 6` in `vercel.json`.

### Enable / disable

1. Set `MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED=true` on Vercel Production.
2. Set `CRON_SECRET` (random string); redeploy so `vercel.json` cron is registered.
3. To disable: set `MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED=false` (cron still hits the route but returns `skipped`, no emails).

### Behavior

- Uses `deliverWeeklyMissionHubDigest({ broadcastToMembers: true })` (Phase 2).
- Skips when cron flag off, email flag off, or `hasContent` is false.
- Dedupe: `weekly-digest:{YYYY-WW}:email` per recipient — duplicate Saturday runs do not resend.
- Logs summary: `startedAt`, `dateRange`, `eligibleRecipients`, `sent`, `deduped`, `skipped`, `failed`, `hasContent`.

### Manual fallback

**Admin → Mission Hub → Weekly digest:** Preview, **Send test to me**, **Send to members**, **Force resend**.
