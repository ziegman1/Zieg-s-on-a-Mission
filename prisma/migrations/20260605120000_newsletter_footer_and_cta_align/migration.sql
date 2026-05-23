-- Newsletter branding footer image
ALTER TABLE "newsletter_brand_settings"
  ADD COLUMN IF NOT EXISTS "default_footer_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "footer_alt_text" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "use_default_footer_image_on_new" BOOLEAN NOT NULL DEFAULT true;

-- Per-newsletter footer override + CTA alignment
ALTER TABLE "newsletters"
  ADD COLUMN IF NOT EXISTS "footer_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "footer_alt_text" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "use_default_footer_image" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "cta_align" TEXT NOT NULL DEFAULT 'center';
