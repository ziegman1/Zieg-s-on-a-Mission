import { z } from "zod";
import { formatRecruitInputErrors } from "@/lib/recruits/recruit-form";

const pathwaySchema = z.enum([
  "TEAM_EXPANSION_RECRUIT",
  "NATIONAL_PARTNER",
  "TRAINING_PARTICIPANT",
]);

const designationSchema = z.enum([
  "OVERSEAS_MISSIONARY",
  "INTERNATIONAL_SERVICES",
  "D_COURSE",
  "NATIONAL_WORKER",
  "OTHER_DISCIPLE_MAKER",
]);

const activityTypeSchema = z.enum([
  "JONATHAN_TRAINING",
  "MEDICAL_TRAINING",
  "SUPPORT_RAISING_COACHING",
  "D_COURSE",
  "ZUME",
  "FOUR_FIELDS_ONLINE",
  "FIDELIS",
  "OTHER",
]);

const activityStatusSchema = z.enum(["PARTICIPATED", "COMPLETED"]);

/** Empty string becomes null. A real value must be a calendar day, YYYY-MM-DD. */
const optionalDay = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use a valid date")
  .transform((value) => (value === "" ? null : value));

const optionalId = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || z.string().uuid().safeParse(value).success, "Choose a valid record");

export const ministryPersonSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(120),
  pathway: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(pathwaySchema.nullable()),
  notes: z.string().trim().max(4000),
  householdWithPersonId: optionalId,
  legacyRecruitId: optionalId,
});

export type MinistryPersonInput = z.infer<typeof ministryPersonSchema>;

export const ministryMilestoneSchema = z
  .object({
    mobilized: z.boolean(),
    mobilizedOn: optionalDay,
    trainedEquipped: z.boolean(),
    trainedEquippedOn: optionalDay,
    sent: z.boolean(),
    sentOn: optionalDay,
    sentDesignation: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value))
      .pipe(designationSchema.nullable()),
    sentVerifiedBy: z.string().trim().max(120),
    sentVerificationNote: z.string().trim().max(4000),
  })
  .superRefine((value, ctx) => {
    if (value.sent && !value.sentDesignation) {
      ctx.addIssue({
        code: "custom",
        path: ["sentDesignation"],
        message: "Choose a Sent designation",
      });
    }
  });

export type MinistryMilestoneInput = z.infer<typeof ministryMilestoneSchema>;

/** Profile and milestones submitted together from Manage Person. */
export const ministryPersonSaveSchema = ministryPersonSchema
  .extend({
    jonathanTrainingComplete: z.boolean(),
    fullyFunded: z.boolean(),
    confirmHistoryChange: z.boolean(),
  })
  .and(ministryMilestoneSchema);

export type MinistryPersonSaveInput = z.infer<typeof ministryPersonSaveSchema>;

export const ministryActivitySchema = z.object({
  activityType: activityTypeSchema,
  status: activityStatusSchema,
  activityOn: optionalDay,
  location: z.string().trim().max(200),
  notes: z.string().trim().max(4000),
});

export type MinistryActivityInput = z.infer<typeof ministryActivitySchema>;

export function formatMinistryInputErrors(error: z.ZodError): string {
  return formatRecruitInputErrors(error);
}

/** Calendar day for a Prisma @db.Date value. Null stays null. */
export function toCalendarDay(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/** UTC midnight for a YYYY-MM-DD string, or null when the day was left blank. */
export function fromCalendarDay(value: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}
