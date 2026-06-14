# Mission Hub notification preference audit & admin alerts

Mission Hub records member notification preference and email suppression changes in `notification_preference_events`. Admins can review activity on **Admin → Community → Members** and optionally receive email alerts for high-priority events.

## Prerequisites

Apply migrations (in order):

1. `20260610120000_email_suppressions`
2. `20260614120000_notification_preference_events`

```bash
npm run db:migrate:deploy:production
```

Weekly digest sends call `verifyEmailSuppressionsTableReady()` before delivery. If `email_suppressions` is missing, send aborts with a clear error (digest content is unchanged).

## Audit table

| Column | Purpose |
|--------|---------|
| `user_id` | Linked User account |
| `member_id` | Mission Hub member profile (if linked) |
| `email` | Normalized address |
| `event_type` | See event types below |
| `actor_type` | `user`, `admin`, `system`, or `webhook` |
| `previous_prefs` / `next_prefs` | JSON snapshots when applicable |
| `metadata` | `source`, `reason`, `adminAlertSent`, etc. |

### Event types

- `email_channel_disabled` / `email_channel_enabled`
- `weekly_digest_disabled` / `weekly_digest_enabled`
- `category_frequency_changed`
- `unsubscribe_link_used`
- `suppression_created` / `suppression_removed`
- `partnership_prefs_synced`

### Write paths

All preference writes go through:

- `saveMissionHubNotificationPreferences()` — settings UI, token-based email prefs
- `unsubscribeMissionHubEmail()` — one-click unsubscribe links
- `syncMissionHubEmailSuppression()` — keeps `email_suppressions` in sync
- `upsertEmailSuppression()` / `removeEmailSuppression()` — suppression audit
- `saveUserPartnershipPreferences()` — partnership onboarding (includes suppression sync)

## Admin UI

**Admin → Mission Hub → Members** includes:

- **Subscriber activity** — last 30-day summary counts + recent events table
- Filter by event type

## Admin email alerts (optional)

Set on Vercel production:

```bash
MISSION_HUB_ADMIN_ALERT_EMAILS="owner@ziegsonamission.com,ops@ziegsonamission.com"
```

Also requires Mission Hub email to be configured (`RESEND_API_KEY`, `ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS=true`, etc.).

### Alerted events

| Event | Email alert? |
|-------|----------------|
| `unsubscribe_link_used` | Yes |
| `email_channel_disabled` | Yes |
| `suppression_created` (bounce / complaint) | Yes |
| `suppression_removed` | Yes |
| Weekly digest toggles | No |
| Category frequency changes | No |
| Unsubscribe-driven suppressions (`reason: unsubscribe`) | No (unsubscribe event already alerts) |

Each audit row sends **at most one** admin alert (`metadata.adminAlertSent` dedupe).

If `MISSION_HUB_ADMIN_ALERT_EMAILS` is unset, events are still logged; alerts are skipped silently.

## Code map

| File | Role |
|------|------|
| `src/lib/mission-hub/notification-preference-event-types.ts` | Event/actor types + labels |
| `src/lib/mission-hub/notification-preference-event-diff.ts` | Pure diff logic (tested) |
| `src/lib/mission-hub/notification-preference-events.ts` | Persist + query + suppression table check |
| `src/lib/mission-hub/notification-preference-admin-alerts.ts` | Optional admin alert emails |
| `src/lib/mission-hub/mission-hub-email-preferences.ts` | Central preference save + hooks |
| `src/components/community/mission-hub-subscriber-activity-panel.tsx` | Admin UI |

## Future: bounce / complaint webhooks

`upsertEmailSuppression({ reason: "bounce" | "complaint", audit: { actorType: "webhook" } })` is ready for a Resend webhook handler. Those suppressions trigger admin email alerts when configured.
