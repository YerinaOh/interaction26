import type { ModelId } from "./models";
import type { Part } from "./steps";
import type { Choice, RoundRecord } from "./types";

export interface PartTally {
  part: Part;
  total: number;
  labelOpus: number; // 'Opus'라고 적힌 카드를 고른 횟수
  actualOpus: number; // 실제로 Opus가 쓴 답변을 고른 횟수
}

export interface RatingMeans {
  quality: number | null;
  trust: number | null;
}

export interface HaloStats {
  total: number;
  labelOpus: number;
  actualOpus: number;
  labelOpusButHaiku: number; // 'Opus' 카드를 골랐는데 실제로는 Haiku였던 횟수
  byPart: PartTally[];
  rounds: Pick<RoundRecord, "part" | "round" | "taskType" | "chosenLabel" | "chosenActual">[];
  // 화면에 표시된 이름별 평균 점수 — 후광효과가 점수에도 나타나는지 본다
  ratingsByLabel: Record<ModelId, RatingMeans>;
  preferredActual: ModelId | "tie";
}

const CHOICES: Choice[] = ["A", "B"];

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function tally(rounds: RoundRecord[], part: Part): PartTally {
  const inPart = rounds.filter((r) => r.part === part);
  return {
    part,
    total: inPart.length,
    labelOpus: inPart.filter((r) => r.chosenLabel === "opus").length,
    actualOpus: inPart.filter((r) => r.chosenActual === "opus").length,
  };
}

export function computeHaloStats(rounds: RoundRecord[]): HaloStats {
  const ordered = [...rounds].sort((a, b) => a.part - b.part || a.round - b.round);
  const byPart = [tally(ordered, 1), tally(ordered, 2)];
  const labelOpus = byPart.reduce((n, p) => n + p.labelOpus, 0);
  const actualOpus = byPart.reduce((n, p) => n + p.actualOpus, 0);
  const total = ordered.length;

  const ratingsByLabel = {} as Record<ModelId, RatingMeans>;
  for (const model of ["opus", "haiku"] as const) {
    const rated = ordered.flatMap((r) => CHOICES.filter((c) => r.labels[c] === model).map((c) => r.ratings[c]));
    ratingsByLabel[model] = {
      quality: mean(rated.flatMap((x) => (x.quality === undefined ? [] : [x.quality]))),
      trust: mean(rated.flatMap((x) => (x.trust === undefined ? [] : [x.trust]))),
    };
  }

  const actualHaiku = total - actualOpus;
  return {
    total,
    labelOpus,
    actualOpus,
    labelOpusButHaiku: ordered.filter((r) => r.chosenLabel === "opus" && r.chosenActual === "haiku").length,
    byPart,
    rounds: ordered.map(({ part, round, taskType, chosenLabel, chosenActual }) => ({
      part,
      round,
      taskType,
      chosenLabel,
      chosenActual,
    })),
    ratingsByLabel,
    preferredActual: actualOpus === actualHaiku ? "tie" : actualOpus > actualHaiku ? "opus" : "haiku",
  };
}
