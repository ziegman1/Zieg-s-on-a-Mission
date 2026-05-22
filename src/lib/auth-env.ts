/**
 * Auth environment checks for NextAuth (admin + Mission Hub owner login).
 */

export type AuthConfigIssue =
  | "missing_secret"
  | "missing_database_url";

export function getAuthSecret(): string | undefined {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return secret || undefined;
}

export function getAuthConfigIssues(): AuthConfigIssue[] {
  const issues: AuthConfigIssue[] = [];
  if (!getAuthSecret()) issues.push("missing_secret");
  if (!process.env.DATABASE_URL?.trim()) issues.push("missing_database_url");
  return issues;
}

export function authConfigIssueMessage(issue: AuthConfigIssue): string {
  switch (issue) {
    case "missing_secret":
      return "AUTH_SECRET is not set on the server. Add it in Vercel → Settings → Environment Variables (openssl rand -base64 32), then redeploy.";
    case "missing_database_url":
      return "DATABASE_URL is not set. Add your Supabase pooler URL in Vercel, then redeploy.";
    default:
      return "Authentication is not configured.";
  }
}
