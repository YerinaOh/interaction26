// 세션별 실험 조건 배정.
// 참가자가 링크로 처음 들어오면 두 가지를 무작위로 정하고, 세션이 끝날 때까지 바꾸지 않는다.
//   1) condition  — 라벨이 실제 모델과 같은지(match) 뒤바뀌었는지(swap)
//   2) opusLabelSlot — 'Opus' 라벨을 A·B 중 어느 자리에 붙일지 (위치 효과 상쇄)
// 화면 라벨과 실제 모델은 언제나 이 배정에서만 계산한다. 서버도 같은 함수로 기록을 검증한다.

import type { Choice, ModelId } from "./models";

export const CONDITIONS = ["match", "swap"] as const;
export type LabelCondition = (typeof CONDITIONS)[number];

export interface Assignment {
  sessionId: string;
  condition: LabelCondition;
  opusLabelSlot: Choice; // 'Opus' 라벨이 붙는 자리
  assignedAt: string; // ISO 시각
  forced: boolean; // URL ?condition= 으로 조건을 지정한 테스트 세션이면 true (분석에서 제외)
}

export interface SlotMapping {
  labels: Record<Choice, ModelId>; // 화면에 표시한 모델명
  actual: Record<Choice, ModelId>; // 실제로 답변을 쓴 모델
}

const other = (slot: Choice): Choice => (slot === "A" ? "B" : "A");

export function isCondition(value: unknown): value is LabelCondition {
  return typeof value === "string" && (CONDITIONS as readonly string[]).includes(value);
}

export function slotMapping(assignment: Pick<Assignment, "condition" | "opusLabelSlot">): SlotMapping {
  const opus = assignment.opusLabelSlot;
  const labels = { [opus]: "opus", [other(opus)]: "haiku" } as Record<Choice, ModelId>;
  const actual =
    assignment.condition === "match" ? labels : ({ [opus]: "haiku", [other(opus)]: "opus" } as Record<Choice, ModelId>);
  return { labels, actual };
}

function coinFlip(): boolean {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] & 1) === 1;
}

export function createAssignment(forcedCondition?: LabelCondition): Assignment {
  return {
    sessionId: crypto.randomUUID(),
    condition: forcedCondition ?? (coinFlip() ? "swap" : "match"),
    opusLabelSlot: coinFlip() ? "A" : "B",
    assignedAt: new Date().toISOString(),
    forced: forcedCondition !== undefined,
  };
}

export function isAssignment(value: unknown): value is Assignment {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.sessionId === "string" &&
    isCondition(a.condition) &&
    (a.opusLabelSlot === "A" || a.opusLabelSlot === "B") &&
    typeof a.assignedAt === "string" &&
    typeof a.forced === "boolean"
  );
}
