import { z } from "zod";

export const NATIONAL_PARTNER_TRAINING_TYPES = [
  "JONATHAN_TRAINING",
  "FOUR_FIELDS",
  "MEDICAL_TRAINING",
] as const;

export type NationalPartnerTrainingType = (typeof NATIONAL_PARTNER_TRAINING_TYPES)[number];

export const NATIONAL_PARTNER_TRAINING_LABELS: Record<NationalPartnerTrainingType, string> = {
  JONATHAN_TRAINING: "Jonathan Training (DMM)",
  FOUR_FIELDS: "Four Fields",
  MEDICAL_TRAINING: "Medical Training",
};

const TRAINING_TYPE_ERROR = "Choose Jonathan Training, Four Fields, or Medical Training";

const trainingTypeSchema = z.enum(NATIONAL_PARTNER_TRAINING_TYPES, {
  errorMap: () => ({ message: TRAINING_TYPE_ERROR }),
});

const completedCountSchema = z
  .string()
  .trim()
  .min(1, "Enter how many completed training")
  .regex(/^[1-9]\d*$/, "Enter a positive whole number")
  .transform((value) => Number(value))
  .refine((value) => value <= 1_000_000, "Enter a positive whole number up to 1000000");

export const nationalPartnerInitiativeSchema = z.object({
  nation: z.string().trim().min(1, "Nation is required").max(120, "Nation is too long"),
  area: z.string().trim().min(1, "Area, region, or state is required").max(200, "Area is too long"),
  trainingType: trainingTypeSchema,
  completedCount: completedCountSchema,
});

export const nationalPartnerInitiativeCreateSchema = nationalPartnerInitiativeSchema.and(
  z.object({
    submissionKey: z.string().uuid("Save this initiative once"),
  }),
);

export type NationalPartnerInitiativeInput = z.infer<typeof nationalPartnerInitiativeSchema>;

export type NationalPartnerInitiativeView = {
  id: string;
  nation: string;
  area: string;
  trainingType: NationalPartnerTrainingType;
  completedCount: number;
};

export type NationalPartnerInitiativeAuditView = NationalPartnerInitiativeAuditInput & {
  id: string;
  initiativeId: string;
};

const FIELD_LABELS: Record<string, string> = {
  nation: "Nation",
  area: "Area / Region / State",
  trainingType: "Training type",
  completedCount: "Number completed",
  submissionKey: "Submission",
};

export function formatNationalPartnerInitiativeErrors(error: z.ZodError): string {
  const flat = error.flatten();
  const parts = [...flat.formErrors];
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (!messages?.length) continue;
    parts.push(`${FIELD_LABELS[field] ?? field}: ${messages.join(", ")}`);
  }
  return parts.filter(Boolean).join(" · ") || "Invalid initiative";
}

export type NationalPartnerInitiativeAuditInput = {
  action: "CREATED" | "UPDATED" | "DELETED";
  nation: string;
  area: string;
  trainingType: NationalPartnerTrainingType;
  completedCount: number;
  previousNation: string | null;
  previousArea: string | null;
  previousTrainingType: NationalPartnerTrainingType | null;
  previousCompletedCount: number | null;
  createdAt: string;
};

export function formatNationalPartnerInitiativeAudit(
  audit: NationalPartnerInitiativeAuditInput,
): string {
  const training = NATIONAL_PARTNER_TRAINING_LABELS[audit.trainingType];
  const place = `${audit.nation}, ${audit.area}, ${training}`;
  const day = audit.createdAt.slice(0, 10);
  if (audit.action === "CREATED") {
    return `${day} · Added ${place}, ${audit.completedCount} completed.`;
  }
  if (audit.action === "DELETED") {
    return `${day} · Removed ${place}, ${audit.completedCount} completed.`;
  }
  const previousPlace =
    audit.previousNation && audit.previousArea && audit.previousTrainingType
      ? `${audit.previousNation}, ${audit.previousArea}, ${NATIONAL_PARTNER_TRAINING_LABELS[audit.previousTrainingType]}`
      : null;
  const previousCount = audit.previousCompletedCount ?? audit.completedCount;
  if (previousPlace && previousPlace !== place) {
    return `${day} · Changed ${previousPlace}, ${previousCount} completed, to ${place}, ${audit.completedCount} completed.`;
  }
  return `${day} · Changed ${place} from ${previousCount} to ${audit.completedCount} completed.`;
}
