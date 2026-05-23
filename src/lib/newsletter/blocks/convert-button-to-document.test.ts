import { describe, expect, it } from "vitest";
import { convertButtonBlockToDocument } from "./convert-button-to-document";

describe("convertButtonBlockToDocument", () => {
  it("maps label and hosted URL to document block", () => {
    const hosted =
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/a.pdf";
    const doc = convertButtonBlockToDocument({
      id: "b1",
      type: "button",
      label: "Get the report",
      url: hosted,
      align: "left",
    });
    expect(doc.type).toBe("document");
    expect(doc.id).toBe("b1");
    expect(doc.documentUrl).toBe(hosted);
    expect(doc.buttonLabel).toBe("Get the report");
    expect(doc.align).toBe("left");
  });

  it("clears invalid local URL on convert", () => {
    const doc = convertButtonBlockToDocument({
      id: "b1",
      type: "button",
      label: "PDF",
      url: "file:///tmp/x.pdf",
      align: "center",
    });
    expect(doc.documentUrl).toBe("");
    expect(doc.buttonLabel).toBe("PDF");
  });
});
