import { MissionHubPageHeader } from "./mission-hub-page-header";

export function CommunitySpacePageHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <MissionHubPageHeader
      title={title}
      subtitle={subtitle}
      className={className ?? "mb-1"}
    />
  );
}
