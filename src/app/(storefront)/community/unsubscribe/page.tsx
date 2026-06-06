import { UnsubscribePublicPanel } from "@/components/community/unsubscribe-public-panel";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <UnsubscribePublicPanel token={params.token ?? ""} />;
}
