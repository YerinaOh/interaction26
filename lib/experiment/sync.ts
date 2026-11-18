// 진행 상황을 서버(/api/sessions)로 보낸다.
// 단계가 바뀔 때마다 그 시점의 전체 스냅샷을 보내므로, 중간에 이탈해도 그때까지의 선택은 남는다.
// 실패해도 참가자 진행은 막지 않는다 (다음 단계에서 최신 스냅샷이 다시 간다).

import type { Step } from "./steps";
import type { ExperimentData } from "./types";

export interface SessionSnapshot {
  seq: number; // 단계 인덱스 — 서버는 세션별로 가장 큰 seq를 최종본으로 쓴다
  screen: Step["screen"];
  sentAt: string;
  data: ExperimentData;
}

export function sendSnapshot(snapshot: SessionSnapshot): void {
  const body = JSON.stringify(snapshot);
  // keepalive: 마지막 화면에서 바로 탭을 닫아도 요청이 끝까지 가도록 (본문 64KB 제한 내)
  fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: body.length < 60_000,
  }).catch(() => {
    // 네트워크 오류는 무시 — 다음 단계 스냅샷이 다시 보낸다
  });
}
