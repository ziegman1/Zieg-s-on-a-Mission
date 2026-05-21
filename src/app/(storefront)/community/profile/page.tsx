import { redirect } from "next/navigation";

/** Profile editing lives in unified settings. */
export default function CommunityProfilePage() {
  redirect("/community/settings?section=profile");
}
