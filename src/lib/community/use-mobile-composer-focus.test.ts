import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("mobile comment composer UX", () => {
  it("shows composer immediately without waiting for comment fetch", () => {
    const comments = readFileSync(
      resolve(process.cwd(), "src/components/community/community-comments.tsx"),
      "utf8",
    );
    expect(comments).toContain("authorResolved");
    expect(comments).toContain("commentsLoading");
    expect(comments).toContain("sticky bottom-[calc");
    expect(comments).not.toContain("disabled={loading}");
    expect(comments).toMatch(/order-1[\s\S]*order-2/);
  });

  it("auto-focuses comment input with retry timing", () => {
    const form = readFileSync(
      resolve(process.cwd(), "src/components/community/community-comment-form.tsx"),
      "utf8",
    );
    expect(form).toContain("useMobileComposerFocus");
    expect(form).toContain("autoFocusKey");
    expect(form).toContain('text-[16px]');

    const hook = readFileSync(
      resolve(process.cwd(), "src/lib/community/use-mobile-composer-focus.ts"),
      "utf8",
    );
    expect(hook).toContain("setSelectionRange");
    expect(hook).toContain("120");
    expect(hook).toContain("240");
  });

  it("opens keyboard synchronously from comment tap (flushSync + pointerdown)", () => {
    const card = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );
    expect(card).toContain("flushSync");
    expect(card).toContain("focusMissionHubCommentInput");
    expect(card).toContain("openCommentsWithKeyboard");
    expect(card).toContain("onCommentsActivate");
    expect(card).not.toMatch(/if \(commentsOpen\) return;/);

    const bar = readFileSync(
      resolve(process.cwd(), "src/components/community/community-engagement-bar.tsx"),
      "utf8",
    );
    expect(bar).toContain("onPointerDown");
    expect(bar).toContain("onCommentsActivate");
    expect(bar).toContain("handleCommentActivatePointerDown");
    expect(bar).toContain("handleCommentActivateClick");
    expect(bar).not.toContain("if (commentsOpen) onCommentsToggle()");

    const hook = readFileSync(
      resolve(process.cwd(), "src/lib/community/use-mobile-composer-focus.ts"),
      "utf8",
    );
    expect(hook).toContain("missionHubCommentInputId");
    expect(hook).toContain("focusMissionHubCommentInput");
  });
});
