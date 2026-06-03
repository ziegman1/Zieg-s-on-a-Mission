/** Build/deploy marker surfaced in Mission Hub for cache-bust verification. */
export function missionHubBuildSha(): string {
  return (
    process.env.NEXT_PUBLIC_MISSION_HUB_BUILD_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim()?.slice(0, 7) ||
    "dev"
  );
}

export function missionHubBuildLabel(): string {
  const sha = missionHubBuildSha();
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
  return `${env}@${sha}`;
}
