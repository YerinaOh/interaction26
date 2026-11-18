// 실험 전체 흐름을 평평한 단계 배열로 정의한다.
// 상태에는 현재 단계의 인덱스만 저장하고, '다음'은 인덱스를 1 올리는 것으로 끝난다.

import { PART1_TASKS } from "./part1Content";
import { PART2_ATTEMPTS } from "./part2Content";

// 라운드 수는 질문지(과업 목록)에서 정해진다
export const PART1_ROUNDS = PART1_TASKS.length;
export const PART2_ROUNDS = PART2_ATTEMPTS.length;

export type ScreenId =
  | "M-01" // 동의·안내
  | "M-02" // 사전 설문
  | "M-03" // 밸런스 게임 · 선택
  | "M-04" // 평점 입력
  | "M-05" // 내 질문 입력
  | "M-06" // 동시 생성 대기
  | "M-07" // 마무리 확인
  | "M-08" // 결과 공개
  | "M-09" // 마무리 설문
  | "END"; // 제출 완료

export type Part = 1 | 2;

export type Step =
  | { screen: "M-01" | "M-02" | "M-07" | "M-08" | "M-09" | "END" }
  | { screen: "M-03" | "M-04" | "M-05" | "M-06"; part: Part; round: number; total: number };

export type RoundStep = Extract<Step, { part: Part }>;

function buildSteps(): Step[] {
  const steps: Step[] = [{ screen: "M-01" }, { screen: "M-02" }];

  for (let round = 1; round <= PART1_ROUNDS; round++) {
    const base = { part: 1 as const, round, total: PART1_ROUNDS };
    steps.push({ screen: "M-03", ...base }, { screen: "M-04", ...base });
  }

  for (let round = 1; round <= PART2_ROUNDS; round++) {
    const base = { part: 2 as const, round, total: PART2_ROUNDS };
    steps.push(
      { screen: "M-05", ...base },
      { screen: "M-06", ...base },
      { screen: "M-03", ...base },
      { screen: "M-04", ...base },
    );
  }

  steps.push({ screen: "M-07" }, { screen: "M-08" }, { screen: "M-09" }, { screen: "END" });
  return steps;
}

export const STEPS: readonly Step[] = buildSteps();

export function isRoundStep(step: Step): step is RoundStep {
  return "part" in step;
}
