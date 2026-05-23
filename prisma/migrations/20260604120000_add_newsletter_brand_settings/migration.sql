-- Newsletter branding (singleton) + per-issue header override

CREATE TABLE "newsletter_brand_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_header_image_url" TEXT,
    "header_alt_text" TEXT NOT NULL DEFAULT '',
    "brand_background_color" TEXT NOT NULL DEFAULT '#F7F3EB',
    "accent_color" TEXT NOT NULL DEFAULT '#D4E8F5',
    "line_accent_color" TEXT NOT NULL DEFAULT '#B8D4E8',
    "default_footer_text" TEXT NOT NULL DEFAULT '',
    "default_cta_label" TEXT NOT NULL DEFAULT '',
    "default_cta_url" TEXT NOT NULL DEFAULT '',
    "use_default_header_for_new" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_brand_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "newsletter_brand_settings" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "newsletters" ADD COLUMN "header_image_url" TEXT;
ALTER TABLE "newsletters" ADD COLUMN "use_default_branded_header" BOOLEAN NOT NULL DEFAULT true;
