# First-party analytics retention

## Scope

- `PageView` — storefront page views (legacy + classified). **Preserved by default.**
- `analytics_sessions` — ephemeral tab sessions (**90-day cleanup default**)
- `analytics_events` — engagement + ministry CTA events (cascade-deleted with sessions)

Mission Hub `community_hub_activity_events` is separate and is **not** covered by this cleanup.

## Cascade safety

| Relationship | On session delete |
|--------------|-------------------|
| `analytics_events.session_id` → `analytics_sessions.id` | **CASCADE** — events removed with session |
| `PageView.sessionId` | **No FK** — PageView rows are **not** deleted when sessions are cleaned |

Therefore the default 90-day cleanup cannot unintentionally wipe PageView history or change historical page-view totals in `/admin/stats` for retained PageView rows. Admin engagement/session cards may show zeros for aged-out sessions while page views remain.

## Policy

| Table | Retention | Notes |
|-------|-----------|--------|
| `analytics_events` | **90 days** | Removed via session cascade |
| `analytics_sessions` | **90 days** | Default cleanup target |
| `PageView` | **Keep** unless ops explicitly opts in | Deleting PageViews requires `--include-page-views` and separate approval |

Do **not** store raw IP, full User-Agent strings, form contents, payment data, or precise pointer trails.

## Cleanup (manual / cron)

```bash
# Safe preview — never deletes
dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90 --dry-run

# Default delete: sessions (+ cascaded events) only
dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90

# Explicit PageView purge (requires approval — can change long-range totals)
dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90 --include-page-views
```

Never run against production without explicit approval. Dry-run never deletes.

## Classification cutoff

Rows with `trafficClass IS NULL` are **historical / unverified**.

Activation time resolution (in order):

1. Env `ANALYTICS_CLASSIFICATION_CUTOFF_ISO` (set at deploy/activation to the real UTC timestamp)
2. Earliest `PageView.createdAt` where `trafficClass IS NOT NULL`
3. Provisional fallback constant (labeled provisional in admin UI until 1 or 2 exists)

Do **not** treat a hardcoded midnight date as the true activation clock.
