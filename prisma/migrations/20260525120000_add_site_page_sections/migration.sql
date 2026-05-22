-- Visual site builder: editable page sections (draft/publish via immediate save + revalidate)

CREATE TABLE "site_page_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_key" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "section_type" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_page_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_page_sections_page_key_section_key_key"
    ON "site_page_sections"("page_key", "section_key");

CREATE INDEX "site_page_sections_page_key_sort_order_idx"
    ON "site_page_sections"("page_key", "sort_order");
