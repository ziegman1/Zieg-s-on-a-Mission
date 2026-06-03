import { missionHubBuildLabel, missionHubBuildSha } from "@/lib/community/mission-hub-build-id";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    sha: missionHubBuildSha(),
    label: missionHubBuildLabel(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    timestamp: new Date().toISOString(),
  });
}
