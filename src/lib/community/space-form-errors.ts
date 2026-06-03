import type { z } from "zod";

/** Flatten zod errors into a single user-visible message (includes field errors). */
export function formatCommunitySpaceInputErrors(error: z.ZodError): string {
  const flat = error.flatten();
  const parts: string[] = [...flat.formErrors];

  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (messages?.length) {
      parts.push(`${field}: ${messages.join(", ")}`);
    }
  }

  return parts.filter(Boolean).join(" · ") || "Invalid input";
}
