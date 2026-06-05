/** Comment button gesture — open/refocus on tap without same-gesture close. */

export type CommentActivateGestureState = {
  pointerActivated: boolean;
};

export function createCommentActivateGestureState(): CommentActivateGestureState {
  return { pointerActivated: false };
}

/** pointerdown: open or refocus; preventDefault when closed suppresses trailing click. */
export function handleCommentActivatePointerDown(
  state: CommentActivateGestureState,
  commentsOpen: boolean,
  preventDefault: () => void,
  onCommentsActivate: () => void,
): void {
  state.pointerActivated = true;
  if (!commentsOpen) {
    preventDefault();
  }
  onCommentsActivate();
}

/**
 * click fallback (desktop / no pointer events): activate only if pointerdown did not run.
 * Never closes the panel.
 */
export function handleCommentActivateClick(
  state: CommentActivateGestureState,
  onCommentsActivate: () => void,
): void {
  if (state.pointerActivated) {
    state.pointerActivated = false;
    return;
  }
  onCommentsActivate();
}
