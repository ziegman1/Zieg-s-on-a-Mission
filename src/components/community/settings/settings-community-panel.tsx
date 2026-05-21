import Link from "next/link";
import { ExternalLink, MessageSquare, Shield, Users } from "lucide-react";
import {
  SettingsComingSoon,
  SettingsPanel,
} from "./settings-ui";

export function SettingsCommunityPanel() {
  return (
    <SettingsPanel
      title="Community management"
      description="Moderation and member tools for Mission Hub leaders."
    >
      <ul className="space-y-2">
        <li>
          <Link
            href="/admin/community/members"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-black/[0.03] transition-colors group"
          >
            <Users className="h-4 w-4 text-brand-primary" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-brand-ink group-hover:text-brand-primary">
                Members
              </span>
              <span className="block text-xs text-brand-ink/50">
                View, block, and manage community members
              </span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-brand-ink/30" aria-hidden />
          </Link>
        </li>
        <li>
          <Link
            href="/admin/community/comments"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-black/[0.03] transition-colors group"
          >
            <MessageSquare className="h-4 w-4 text-brand-primary" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-brand-ink group-hover:text-brand-primary">
                Comments
              </span>
              <span className="block text-xs text-brand-ink/50">
                Review and remove comments
              </span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-brand-ink/30" aria-hidden />
          </Link>
        </li>
        <li>
          <Link
            href="/admin/community/posts"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-black/[0.03] transition-colors group"
          >
            <Shield className="h-4 w-4 text-brand-primary" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-brand-ink group-hover:text-brand-primary">
                Posts
              </span>
              <span className="block text-xs text-brand-ink/50">
                Edit and moderate published posts
              </span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-brand-ink/30" aria-hidden />
          </Link>
        </li>
      </ul>

      <SettingsComingSoon>
        Moderators, featured members, and report queues — planned for a future release.
      </SettingsComingSoon>
    </SettingsPanel>
  );
}
