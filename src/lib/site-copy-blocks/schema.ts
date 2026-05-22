import { z } from "zod";
import { BLOCK_TYPES } from "./types";

const contentLineSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().max(20000),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  metadata: z.record(z.unknown()).optional(),
});

export const contentBlockSchema = z.object({
  id: z.string().min(1).max(120),
  pageKey: z.string().min(1).max(60),
  sectionKey: z.string().min(1).max(80),
  blockKey: z.string().min(1).max(120),
  blockType: z.enum(BLOCK_TYPES),
  label: z.string().min(1).max(200),
  value: z.string().max(50000),
  lines: z.array(contentLineSchema).max(80),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(99999),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const siteCopyBlocksSaveSchema = z.object({
  version: z.literal(2),
  blocks: z.array(contentBlockSchema).min(1).max(500),
});

export type SiteCopyBlocksSaveInput = z.infer<typeof siteCopyBlocksSaveSchema>;
