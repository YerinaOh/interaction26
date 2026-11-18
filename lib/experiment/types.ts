// 실험 응답 데이터의 형태. 각 화면을 구현하면서 필드를 채워 나간다.

import type { GenerationSource } from "@/lib/generation/shared";
import { createAssignment, type Assignment, type LabelCondition } from "./assignment";
import type { Choice, ModelId } from "./models";
import type { TaskId } from "./part1Content";
import type { Part } from "./steps";

export type { Choice };

// M-01 참여 동의
export interface Consent {
  research: boolean; // 학술 연구이며 진행 절차를 이해했습니다
  dataUse: boolean; // 익명 처리된 응답 데이터의 연구 활용에 동의합니다
  noPersonalInfo: boolean; // 직접 질문에 개인정보·기밀을 입력하지 않겠습니다
}

export interface Participant {
  studentId: string;
  name: string;
}

// M-02 사전 설문
export type UsageFrequency = "daily" | "weekly" | "monthly" | "rarely";
export type UsagePurpose = "work" | "study" | "writing" | "search" | "other";

export interface PreSurvey {
  frequency?: UsageFrequency;
  purposes: UsagePurpose[];
  paidSubscription?: boolean;
  perceivedDifference?: number; // 1–7
  earlyAdopter?: number; // 1–7
}

export interface Rating {
  quality?: number; // 1–7 얼마나 좋은 답변인가요?
  trust?: number; // 1–7 얼마나 믿을 만한가요?
}

// 밸런스 게임 한 라운드의 기록 (Part 1·2 공통)
export interface RoundRecord {
  part: Part;
  round: number;
  taskId: TaskId | "custom"; // 분석용 과업 id (custom = Part 2 직접 입력)
  taskType: string;
  prompt: string;
  labels: Record<Choice, ModelId>; // 화면에 표시한 모델명
  actual: Record<Choice, ModelId>; // 실제로 답변을 쓴 모델
  choice: Choice;
  chosenLabel: ModelId; // 고른 카드에 적혀 있던 모델
  chosenActual: ModelId; // 고른 카드의 실제 모델
  decisionMs: number; // 카드가 보인 뒤 고르기까지 걸린 시간
  chosenAt: string; // ISO 시각
  ratings: Record<Choice, Rating>;
}

// Part 2 시도 하나: 사용자가 입력한 질문과 두 모델이 실제로 만든 답변
export interface Part2Entry {
  round: number;
  question: string;
  answers?: Record<ModelId, string>;
  source?: GenerationSource; // mock(가짜) 또는 live(실제 모델)
  generatedAt?: string;
  generationMs?: number; // 요청부터 두 답변 도착까지 걸린 시간
}

// M-07 마무리 확인 (결과 공개 전)
export interface FinalCheck {
  reflection: string; // 1. 답변을 고를 때 가장 많이 본 것 (선택)
  nameInfluence?: number; // 2. 모델 이름이 선택에 영향을 줬다고 생각하는지 (1–7)
}

// M-09 마무리 설문
export type ChoiceCriterion = "accuracy" | "readability" | "modelName" | "length" | "intuition";

export interface PostSurvey {
  criteria: ChoiceCriterion[];
  trustChange?: number; // 1–7 크게 낮아짐 ~ 크게 높아짐
  comment: string;
}

export interface ExperimentData {
  assignment: Assignment; // 세션별 무작위 조건 (라벨 정상/반전, Opus 라벨 위치)
  consent: Consent;
  participant: Participant;
  preSurvey: PreSurvey;
  // 진행 순서대로 쌓이는 라운드 기록
  rounds: RoundRecord[];
  part2: Part2Entry[];
  finalCheck: FinalCheck;
  revealedAt?: string; // M-08 결과를 처음 본 시각
  postSurvey: PostSurvey;
  completedAt?: string; // '제출하고 종료'를 누른 시각
}

export interface ExperimentState {
  stepIndex: number;
  data: ExperimentData;
}

// 새 세션마다 조건을 새로 뽑는다
export const createInitialState = (forcedCondition?: LabelCondition): ExperimentState => ({
  stepIndex: 0,
  data: {
    assignment: createAssignment(forcedCondition),
    consent: { research: false, dataUse: false, noPersonalInfo: false },
    participant: { studentId: "", name: "" },
    preSurvey: { purposes: [] },
    rounds: [],
    part2: [],
    finalCheck: { reflection: "" },
    postSurvey: { criteria: [], comment: "" },
  },
});
