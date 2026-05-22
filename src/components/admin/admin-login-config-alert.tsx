import { authConfigIssueMessage, type AuthConfigIssue } from "@/lib/auth-env";

export function AdminLoginConfigAlert({
  issues,
  error,
}: {
  issues?: AuthConfigIssue[];
  error?: string;
}) {
  if (!issues?.length && !error) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-3 text-sm text-amber-100/95 leading-relaxed"
    >
      {issues?.length ? (
        <ul className="list-disc pl-4 space-y-1.5">
          {issues.map((issue) => (
            <li key={issue}>{authConfigIssueMessage(issue)}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className={issues?.length ? "mt-2" : ""}>{error}</p> : null}
      <p className="mt-2 text-xs text-amber-200/70">
        After updating Vercel env vars, redeploy Production. Admin sign-in still requires an ADMIN or
        STAFF account with a password.
      </p>
    </div>
  );
}
