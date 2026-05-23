# Mission Hub notifications (in-app)

In-app activity notifications for signed-in users. No email, push, or websockets yet.

## Migration

```bash
npm run db:migrate        # local
npm run db:migrate:deploy # production
```

Migration: `prisma/migrations/20260527120000_add_community_notifications/migration.sql`

## Who gets what

| Event | Recipients |
|-------|------------|
| Comment or reply on a post (non-owner actor) | All ADMIN/STAFF users |
| Reply to a top-level comment | Parent comment author (if they have a linked `User`) |
| Reaction added on a post (non-owner) | All ADMIN/STAFF users |
| New newsletter published (from Newsletter Builder) | Active members with newsletters + in-app enabled, not muted on Newsletter space |
| New member account (`/community/join`) | All ADMIN/STAFF users |

Owners do not receive notifications for their own comments or reactions.

## Testing — owner

1. Run migration and sign in as ADMIN/STAFF at `/community/login` or admin credentials on Mission Hub.
2. Open `/community` — bell should be active (not greyed out).
3. In another browser/incognito, join or sign in as a **member**.
4. As member: comment on a post, reply to a comment, add a reaction.
5. As owner: refresh — bell badge should increment; open panel to see items.
6. Click a notification — navigates to `/community/{space}#post-{id}` and marks read.
7. Use **Mark all read** to clear the badge.

## Testing — member

1. Sign in as member A, comment on a post.
2. Sign in as member B, reply to member A’s comment.
3. As member A: bell shows **reply_to_comment** notification.

## Testing — newsletter publish

1. Sign in as member with default notification prefs (newsletters + in-app on).
2. Admin publishes a newsletter from Newsletter Builder.
3. Member refreshes Mission Hub — bell badge increments; **New newsletter published** appears.
4. Click notification — opens `/community/newsletters#post-{id}` (Newsletter space post).
5. Republish the same newsletter — no duplicate notification row; existing item refreshes and becomes unread again.

Also run migration `20260607120000_community_notification_dedupe` for `dedupe_key` / `metadata` columns.

## Security

- Server actions require Auth.js session `user.id`.
- Queries always filter `recipient_user_id = session user`.
- RLS on `community_notifications` denies anon/authenticated direct access; Prisma uses postgres role.
