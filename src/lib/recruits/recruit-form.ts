import { z } from "zod";

/** Adding a recruit is the Mobilized event, so creation needs nothing but a name. */
export const recruitInputSchema = z.object({
  name: z.string().trim().min(1, "Recruit name is required").max(120),
});

export type RecruitFormInput = z.input<typeof recruitInputSchema>;
export type RecruitFormData = z.infer<typeof recruitInputSchema>;

/** The two milestone checkboxes an admin can toggle after a recruit exists. */
export const recruitMilestoneSchema = z.object({
  jonathanTrainingComplete: z.boolean(),
  fullyFunded: z.boolean(),
});

export type RecruitMilestoneUpdate = z.infer<typeof recruitMilestoneSchema>;

/** Flatten Zod issues into one human-readable line, matching the community admin convention. */
export function formatRecruitInputErrors(error: z.ZodError): string {
  const flat = error.flatten();
  const parts: string[] = [...flat.formErrors];
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (messages?.length) parts.push(`${field}: ${messages.join(", ")}`);
  }
  return parts.filter(Boolean).join(" · ") || "Invalid input";
}
