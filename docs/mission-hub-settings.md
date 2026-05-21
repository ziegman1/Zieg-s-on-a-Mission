# Mission Hub settings

Unified settings at `/community/settings` with role-aware navigation.

## Migration

```bash
npm run db:migrate        # local
npm run db:migrate:deploy # production (.env.local)
```

Production Mission Hub empty after deploy? See [mission-hub-production-setup.md](./mission-hub-production-setup.md) (migrations + default spaces seed).

Files:

- `prisma/migrations/20260528120000_add_mission_hub_settings/migration.sql`
- `prisma/migrations/20260530120000_add_community_space_experience/migration.sql` — space welcome, engagement prompts, interaction columns

Adds (settings migration):

- `community_members.display_name`, `bio`
- `User.community_notification_prefs` (JSONB)
- `community_spaces.cover_image_url`, `featured`, `settings` (JSONB)
- `community_hub_settings` (singleton row `default`)

## Sections

### All signed-in users

| Section | URL | Features |
|---------|-----|----------|
| Profile | `?section=profile` | Photo, name, display name, bio, email (read-only) |
| Notifications | `?section=notifications` | In-app toggles; email placeholder |
| Password | `?section=account` | Change credentials password |

### ADMIN / STAFF only

| Section | URL | Features |
|---------|-----|----------|
| Mission Hub | `?section=hub` | Title, tagline, images, welcome, invitation card copy |
| Spaces | `?section=spaces` | Welcome message, engagement prompt, space type/mood, cover upload, interaction toggles |
| Community | `?section=community` | Links to admin members, comments, posts |

## Architecture

- `src/lib/community/settings-types.ts` — section keys, schemas, defaults
- `src/lib/community/settings-data.ts` — server page loader
- `src/app/(storefront)/community/settings-actions.ts` — mutations
- `src/components/community/settings/*` — modular panels
- `src/components/community/settings/community-settings-shell.tsx` — layout shell

`/community/profile` redirects to `?section=profile`.

## Future hooks

- Wire `community_notification_prefs` into notification creation
- Enforce `community_spaces.settings` on comments/reactions/posting
- Email channel when transactional email is ready
