import { slotMapping } from "./assignment";
import type { ModelId } from "./models";
import { PART1_TASKS, getFixedResponses, type TaskId } from "./part1Content";
import type { RoundStep } from "./steps";
import type { Choice, ExperimentData, Part2Entry, Rating, RoundRecord } from "./types";

export interface RoundView {
  taskId: TaskId | "custom"; // custom = Part 2 직접 입력
  taskType: string;
  prompt: string;
  answers: Record<Choice, string>; // 화면 A/B 자리에 들어갈 답변
}

// 화면에 보여줄 라운드 콘텐츠. A/B 자리에 어떤 모델의 답변이 들어갈지는 세션 배정(slotMapping)이 정한다.
export function getRoundView(step: RoundStep, data: ExperimentData): RoundView {
  const { actual } = slotMapping(data.assignment);
  const toSlots = (responses: Record<ModelId, string>): Record<Choice, string> => ({
    A: responses[actual.A],
    B: responses[actual.B],
  });
  if (step.part === 1) {
    const task = PART1_TASKS[step.round - 1];
    return { taskId: task.id, taskType: task.taskType, prompt: task.prompt, answers: toSlots(getFixedResponses(task.id)) };
  }
  const entry = findPart2(data.part2, step.round);
  return {
    taskId: "custom",
    taskType: "내 질문",
    prompt: entry?.question ?? "",
    answers: entry?.answers ? toSlots(entry.answers) : { A: "", B: "" },
  };
}

export function findPart2(entries: Part2Entry[], round: number): Part2Entry | undefined {
  return entries.find((e) => e.round === round);
}

// 같은 시도의 기록이 있으면 합치고, 없으면 새로 붙인다
export function upsertPart2(entries: Part2Entry[], round: number, patch: Partial<Part2Entry>): Part2Entry[] {
  const existing = findPart2(entries, round);
  if (!existing) return [...entries, { round, question: "", ...patch }];
  return entries.map((e) => (e.round === round ? { ...e, ...patch } : e));
}

export function findRound(rounds: RoundRecord[], step: RoundStep): RoundRecord | undefined {
  return rounds.find((r) => r.part === step.part && r.round === step.round);
}

// 같은 라운드 기록이 있으면 교체하고, 없으면 뒤에 붙인다
export function upsertRound(rounds: RoundRecord[], record: RoundRecord): RoundRecord[] {
  const index = rounds.findIndex((r) => r.part === record.part && r.round === record.round);
  if (index === -1) return [...rounds, record];
  return rounds.map((r, i) => (i === index ? record : r));
}

export function updateRating(
  rounds: RoundRecord[],
  step: RoundStep,
  target: Choice,
  patch: Partial<Rating>,
): RoundRecord[] {
  return rounds.map((r) =>
    r.part === step.part && r.round === step.round
      ? { ...r, ratings: { ...r.ratings, [target]: { ...r.ratings[target], ...patch } } }
      : r,
  );
}

export function isRatingComplete(record: RoundRecord | undefined): boolean {
  if (!record) return false;
  return (["A", "B"] as const).every((c) => record.ratings[c].quality !== undefined && record.ratings[c].trust !== undefined);
}
