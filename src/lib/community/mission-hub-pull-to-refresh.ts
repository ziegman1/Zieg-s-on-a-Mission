import {
  MISSION_HUB_PTR_MAX_PULL_PX,
  MISSION_HUB_PTR_TRIGGER_PX,
} from "@/lib/community/mission-hub-refresh";

export type PullToRefreshTouchState = {
  active: boolean;
  startY: number;
  pullPx: number;
};

export function canStartPullToRefresh(scrollTop: number): boolean {
  return scrollTop <= 0;
}

/** Rubber-band style offset for the refresh indicator. */
export function pullToRefreshOffsetPx(rawPullPx: number): number {
  const clamped = Math.max(0, Math.min(rawPullPx, MISSION_HUB_PTR_MAX_PULL_PX));
  return clamped * 0.55;
}

export function shouldTriggerPullToRefresh(pullPx: number): boolean {
  return pullPx >= MISSION_HUB_PTR_TRIGGER_PX;
}

export function pullToRefreshProgress(pullPx: number): number {
  return Math.min(1, Math.max(0, pullPx / MISSION_HUB_PTR_TRIGGER_PX));
}

export function nextPullTouchState(
  state: PullToRefreshTouchState,
  touchY: number,
  scrollTop: number,
): PullToRefreshTouchState {
  if (!state.active) return state;
  if (!canStartPullToRefresh(scrollTop)) {
    return { active: false, startY: 0, pullPx: 0 };
  }
  const pullPx = Math.max(0, touchY - state.startY);
  return { ...state, pullPx };
}
