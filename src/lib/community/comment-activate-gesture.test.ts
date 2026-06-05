import { describe, expect, it } from "vitest";
import {
  createCommentActivateGestureState,
  handleCommentActivateClick,
  handleCommentActivatePointerDown,
} from "@/lib/community/comment-activate-gesture";

describe("comment activate gesture", () => {
  it("opens on pointerdown when closed and prevents trailing click from re-handling", () => {
    const state = createCommentActivateGestureState();
    let commentsOpen = false;
    let activateCount = 0;
    let preventDefaultCount = 0;

    handleCommentActivatePointerDown(
      state,
      commentsOpen,
      () => {
        preventDefaultCount += 1;
      },
      () => {
        activateCount += 1;
        commentsOpen = true;
      },
    );

    expect(commentsOpen).toBe(true);
    expect(activateCount).toBe(1);
    expect(preventDefaultCount).toBe(1);

    handleCommentActivateClick(state, () => {
      activateCount += 1;
      commentsOpen = false;
    });

    expect(commentsOpen).toBe(true);
    expect(activateCount).toBe(1);
  });

  it("refocuses on pointerdown when already open without closing", () => {
    const state = createCommentActivateGestureState();
    let activateCount = 0;
    let preventDefaultCount = 0;

    handleCommentActivatePointerDown(
      state,
      true,
      () => {
        preventDefaultCount += 1;
      },
      () => {
        activateCount += 1;
      },
    );

    expect(activateCount).toBe(1);
    expect(preventDefaultCount).toBe(0);

    handleCommentActivateClick(state, () => {
      activateCount += 1;
    });

    expect(activateCount).toBe(1);
  });

  it("falls back to click activate when pointerdown did not run", () => {
    const state = createCommentActivateGestureState();
    let activateCount = 0;

    handleCommentActivateClick(state, () => {
      activateCount += 1;
    });

    expect(activateCount).toBe(1);
  });

  it("does not call legacy close-on-click behavior during pointerdown + click", () => {
    const state = createCommentActivateGestureState();
    let commentsOpen = false;
    let activateCount = 0;
    let closeCount = 0;

    const activate = () => {
      activateCount += 1;
      commentsOpen = true;
    };
    const legacyCloseOnClick = () => {
      closeCount += 1;
      commentsOpen = false;
    };

    handleCommentActivatePointerDown(state, false, () => {}, activate);

    if (commentsOpen) {
      legacyCloseOnClick();
    }

    expect(commentsOpen).toBe(false);
    expect(closeCount).toBe(1);

    commentsOpen = false;
    closeCount = 0;
    activateCount = 0;

    handleCommentActivatePointerDown(state, false, () => {}, activate);
    handleCommentActivateClick(state, legacyCloseOnClick);

    expect(commentsOpen).toBe(true);
    expect(activateCount).toBe(1);
    expect(closeCount).toBe(0);
  });
});
