export type ReactionOnPostNotificationMetadata = {
  reactionType: string;
  actorDisplayName: string;
};

export function formatReactionPostRef(
  postTitle: string | null | undefined,
): string {
  const trimmed = postTitle?.trim();
  if (trimmed) return `"${trimmed}"`;
  return "a post";
}

/** Build a grammatical in-app title for reaction_on_post notifications. */
export function buildReactionNotificationTitle(input: {
  actorDisplayName: string;
  reactionType: string;
  postTitle: string | null | undefined;
}): string {
  const actor = input.actorDisplayName.trim() || "Someone";
  const postRef = formatReactionPostRef(input.postTitle);
  const reactionType = input.reactionType.trim().toLowerCase();

  switch (reactionType) {
    case "prayed":
    case "amen":
      return `${actor} said amen to ${postRef}`;
    case "like":
      return `${actor} is standing with you`;
    case "love":
      return `${actor} is praying with you`;
    case "celebrating":
      return `${actor} is rejoicing`;
    case "encouraged":
      return `${actor} was encouraged`;
    case "pray":
      return `${actor} prayed for ${postRef}`;
    case "celebrate":
      return `${actor} celebrated ${postRef}`;
    default:
      return `${actor} reacted to ${postRef}`;
  }
}
