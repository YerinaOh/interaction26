// Part 1 고정 답변의 품질 차이를 다른 모델이 블라인드로 채점한다.
// 모델 이름은 숨기고 '답변 1/2'로만 보여주며, 순서를 바꿔 두 번씩 채점해 첫 번째 답변 선호(위치 편향)를 상쇄한다.
//
//   npm run judge:part1                            기본 심사위원(claude-sonnet-5-5)으로 채점
//   npm run judge:part1 -- --label=high --reps=3   결과 파일 이름표, 순서별 반복 횟수
//   npm run judge:part1 -- --judge=claude-opus-5-5 --input=reports/part1Responses-low.json
//
// 심사위원 기본값을 Sonnet으로 둔 이유: Opus가 심사하면 자기 답변을 선호하는 경향(self-preference)이 섞일 수 있다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { askJson, isAuthenticationError } from "@/lib/generation/claude";
import type { ModelId } from "@/lib/experiment/models";
import { PART1_TASKS, type GeneratedTask, type TaskId } from "@/lib/experiment/part1Content";
import { argValue, requireApiKey } from "./common.mts";

requireApiKey();

const args = process.argv.slice(2);
const JUDGE = argValue(args, "judge") ?? "claude-sonnet-5-5";
const REPS = Number(argValue(args, "reps") ?? 2);
const LABEL = argValue(args, "label") ?? new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const INPUT = argValue(args, "input") ?? "lib/experiment/part1Responses.json";

const responses = JSON.parse(readFileSync(INPUT, "utf8")) as Partial<Record<TaskId, GeneratedTask>>;

interface Verdict {
  winner: "1" | "2" | "tie";
  score_1: number;
  score_2: number;
  reason: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    winner: { type: "string", enum: ["1", "2", "tie"] },
    score_1: { type: "integer" },
    score_2: { type: "integer" },
    reason: { type: "string" },
  },
  required: ["winner", "score_1", "score_2", "reason"],
  additionalProperties: false,
};

const SYSTEM = `당신은 AI 답변의 품질을 평가하는 공정한 심사위원입니다.
- 두 답변의 작성자는 공개되지 않습니다. 작성자를 추측하지 마세요.
- 요청을 얼마나 정확하고 충실하게 수행했는지, 내용이 정확한지, 한국어가 자연스럽고 읽기 쉬운지를 봅니다.
- 길이가 길다는 이유만으로, 또는 먼저 제시됐다는 이유만으로 높게 평가하지 마세요.
- 각 답변을 1~7점(7점이 가장 좋음)으로 채점하고, 더 나은 쪽을 고르세요. 정말 우열을 가릴 수 없을 때만 tie를 고르세요.
- reason은 한국어 한두 문장으로 핵심 차이만 적으세요.`;

function judgePrompt(prompt: string, focus: string, first: string, second: string): string {
  return `[사용자 요청]
${prompt}

[평가 시 특히 볼 점]
${focus}

[답변 1]
${first}

[답변 2]
${second}`;
}

const clampScore = (n: number) => Math.min(7, Math.max(1, Math.round(n)));

interface Trial {
  order: "opus-first" | "haiku-first";
  winner: ModelId | "tie";
  scores: Record<ModelId, number>;
  reason: string;
}

async function judgeOnce(prompt: string, focus: string, answers: Record<ModelId, string>, order: Trial["order"]): Promise<Trial> {
  const [first, second]: ModelId[] = order === "opus-first" ? ["opus", "haiku"] : ["haiku", "opus"];
  const v = await askJson<Verdict>(JUDGE, SYSTEM, judgePrompt(prompt, focus, answers[first], answers[second]), SCHEMA);
  return {
    order,
    winner: v.winner === "tie" ? "tie" : v.winner === "1" ? first : second,
    scores: { [first]: clampScore(v.score_1), [second]: clampScore(v.score_2) } as Record<ModelId, number>,
    reason: v.reason,
  };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const report: Record<string, unknown>[] = [];
console.log(`심사위원 ${JUDGE} · 순서별 ${REPS}회 · 입력 ${INPUT}\n`);

for (const task of PART1_TASKS) {
  const generated = responses[task.id];
  if (!generated) {
    console.log(`[${task.id}] 답변이 없어 건너뜀`);
    continue;
  }
  process.stdout.write(`[${task.id}] ${task.taskType} … `);
  try {
    const orders: Trial["order"][] = ["opus-first", "haiku-first"];
    const trials = await Promise.all(
      orders.flatMap((order) => Array.from({ length: REPS }, () => judgeOnce(task.prompt, task.purpose, generated.responses, order))),
    );
    // 무승부는 양쪽에 0.5씩
    const opusPoints = trials.reduce((n, t) => n + (t.winner === "opus" ? 1 : t.winner === "tie" ? 0.5 : 0), 0);
    const opusWinRate = opusPoints / trials.length;
    const scores = { opus: mean(trials.map((t) => t.scores.opus)), haiku: mean(trials.map((t) => t.scores.haiku)) };
    // 순서를 바꿔도 같은 쪽이 이겼는지 — 낮으면 판정이 순서에 흔들린 것
    const byOrder = orders.map((o) => trials.filter((t) => t.order === o));
    const majority = (ts: Trial[]) => {
      const o = ts.filter((t) => t.winner === "opus").length;
      const h = ts.filter((t) => t.winner === "haiku").length;
      return o > h ? "opus" : h > o ? "haiku" : "tie";
    };
    const consistent = majority(byOrder[0]) === majority(byOrder[1]);

    report.push({ task: task.id, taskType: task.taskType, effort: generated.effort ?? "low", opusWinRate, scores, consistent, trials });
    console.log(
      `Opus 승률 ${(opusWinRate * 100).toFixed(0)}% · 평균 점수 Opus ${scores.opus.toFixed(1)} / Haiku ${scores.haiku.toFixed(1)}${consistent ? "" : " · ⚠️ 순서에 따라 판정이 갈림"}`,
    );
  } catch (error) {
    if (isAuthenticationError(error)) {
      console.log("실패\n❌ API 키가 올바르지 않아요. .env.local의 ANTHROPIC_API_KEY 값을 확인해 주세요.");
      process.exit(1);
    }
    console.log("실패");
    console.error(error);
  }
}

if (report.length) {
  const overall = mean(report.map((r) => r.opusWinRate as number));
  console.log(`\n전체 Opus 승률 ${(overall * 100).toFixed(0)}%  (목표: 60~75% — 너무 높으면 후광효과가 묻히고, 50% 근처면 차이가 없는 것)`);
  mkdirSync("reports", { recursive: true });
  const out = `reports/judge-${LABEL}.json`;
  writeFileSync(out, `${JSON.stringify({ judge: JUDGE, reps: REPS, input: INPUT, overallOpusWinRate: overall, tasks: report }, null, 2)}\n`);
  console.log(`자세한 판정 이유는 ${out} 에 저장했어요.`);
}
