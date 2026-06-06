import { EmailPreferencesPublicPanel } from "@/components/community/email-preferences-public-panel";

export default async function EmailPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <EmailPreferencesPublicPanel token={params.token ?? ""} />;
}
