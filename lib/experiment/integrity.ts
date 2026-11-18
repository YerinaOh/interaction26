// 기록된 라운드의 라벨·실제 모델이 세션 배정과 맞는지 검사한다.
// 서버가 저장할 때 한 번, 분석 스크립트가 내보낼 때 한 번 더 돌린다.

import { slotMapping, type Assignment } from "./assignment";
import type { RoundRecord } from "./types";

export interface IntegrityReport {
  ok: boolean;
  issues: string[];
}

const CHOICES = ["A", "B"] as const;

export function checkRounds(assignment: Assignment, rounds: RoundRecord[]): IntegrityReport {
  const expected = slotMapping(assignment);
  const issues: string[] = [];

  for (const r of rounds) {
    const where = `part${r.part}-r${r.round}`;
    for (const c of CHOICES) {
      if (r.labels?.[c] !== expected.labels[c]) issues.push(`${where}: labels.${c}=${r.labels?.[c]} (기대값 ${expected.labels[c]})`);
      if (r.actual?.[c] !== expected.actual[c]) issues.push(`${where}: actual.${c}=${r.actual?.[c]} (기대값 ${expected.actual[c]})`);
    }
    if (r.choice !== "A" && r.choice !== "B") {
      issues.push(`${where}: choice=${String(r.choice)}`);
      continue;
    }
    if (r.chosenLabel !== expected.labels[r.choice]) issues.push(`${where}: chosenLabel 불일치`);
    if (r.chosenActual !== expected.actual[r.choice]) issues.push(`${where}: chosenActual 불일치`);
  }

  // 정상 조건이면 라벨=실제, 반전 조건이면 라벨≠실제여야 한다 (slotMapping 자체에 대한 안전장치)
  for (const c of CHOICES) {
    const same = expected.labels[c] === expected.actual[c];
    if (same !== (assignment.condition === "match")) issues.push(`slotMapping 오류: ${assignment.condition} 조건에서 ${c} 자리`);
  }

  return { ok: issues.length === 0, issues };
}
