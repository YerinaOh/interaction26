// Part 1 고정 답변 생성: 각 과업을 실제 Opus 5.5와 Haiku 5.5에 한 번씩 묻고
// lib/experiment/part1Responses.json에 저장한다. 실시간 생성(/api/generate)과 같은 지시문을 쓴다.
//
//   npm run generate:part1                    아직 없는 과업만 생성
//   npm run generate:part1 -- --force         전부 다시 생성
//   npm run generate:part1 -- --only=counseling,translation
//   npm run generate:part1 -- --only=info --attempts=8   글자 수 초과 시 재시도 횟수 (기본 3)
//   npm run generate:part1 -- --force --effort=high      생각 깊이 (low|medium|high|xhigh|max, 기본 high)
import { readFileSync, writeFileSync } from "node:fs";
import { MODEL_IDS, RefusalError, ask, isAuthenticationError, type Effort, type ModelAnswer } from "@/lib/generation/claude";
import type { ModelId } from "@/lib/experiment/models";
import { PART1_TASKS, type FixedTask, type GeneratedTask, type TaskId } from "@/lib/experiment/part1Content";
import { argValue, requireApiKey } from "./common.mts";

const OUTPUT = new URL("../lib/experiment/part1Responses.json", import.meta.url);

requireApiKey();

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = argValue(args, "only")?.split(",");
// 두 모델에 같은 effort를 쓴다. 고정 답변은 한 번만 만들므로 대기 시간보다 품질을 우선한다.
const EFFORT = (argValue(args, "effort") ?? "high") as Effort;

const existing = JSON.parse(readFileSync(OUTPUT, "utf8")) as Partial<Record<TaskId, GeneratedTask>>;
const targets = PART1_TASKS.filter((t) => (only ? only.includes(t.id) : force || !existing[t.id]));

if (targets.length === 0) {
  console.log("모든 과업 답변이 이미 있어요. 다시 만들려면 --force 또는 --only=<과업 id>를 쓰세요.");
  process.exit(0);
}

// 제한을 넘긴 답변을 잘라 쓰면 결론이 빠져 그 모델만 불리해지므로, 제한 안에 들어올 때까지 다시 받는다
const MAX_ATTEMPTS = Number(argValue(args, "attempts") ?? 3);

async function askWithinLimit(model: ModelId, task: FixedTask): Promise<ModelAnswer & { attempts: number }> {
  let best: ModelAnswer | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const answer = await ask(model, task.prompt, { maxChars: task.maxChars, effort: EFFORT });
    if (answer.rawLength <= task.maxChars) return { ...answer, attempts: attempt };
    if (!best || answer.rawLength < best.rawLength) best = answer;
  }
  // 끝내 넘기면 가장 짧았던 답변(잘린 상태)을 남기고 경고한다
  return { ...best!, attempts: MAX_ATTEMPTS };
}

let failed = false;
for (const task of targets) {
  process.stdout.write(`[${task.id}] ${task.taskType} (effort ${EFFORT}) … `);
  try {
    const [opus, haiku] = await Promise.all([askWithinLimit("opus", task), askWithinLimit("haiku", task)]);
    existing[task.id] = {
      responses: { opus: opus.text, haiku: haiku.text },
      rawLength: { opus: opus.rawLength, haiku: haiku.rawLength },
      models: MODEL_IDS,
      maxChars: task.maxChars,
      effort: EFFORT,
      generatedAt: new Date().toISOString(),
    };
    // 과업마다 바로 저장해서 중간에 실패해도 앞의 결과는 남긴다
    writeFileSync(OUTPUT, `${JSON.stringify(existing, null, 2)}\n`);
    const describe = (name: string, a: typeof opus) =>
      `${name} ${a.text.length}자${a.attempts > 1 ? ` (${a.attempts}번째 시도)` : ""}${a.rawLength > task.maxChars ? " ⚠️ 잘림" : ""}`;
    console.log(`완료 (${describe("Opus", opus)} · ${describe("Haiku", haiku)})`);
  } catch (error) {
    failed = true;
    if (isAuthenticationError(error)) {
      // 키가 틀리면 나머지 과업도 모두 실패하므로 바로 멈춘다
      console.log("실패\n❌ API 키가 올바르지 않아요. .env.local의 ANTHROPIC_API_KEY 값을 확인해 주세요.");
      break;
    }
    console.log(error instanceof RefusalError ? `거절됨 (${error.model})` : "실패");
    console.error(error);
  }
}

console.log(
  failed
    ? "\n일부 과업이 실패했어요. 위 메시지를 확인하고 다시 실행하면 아직 없는 과업만 이어서 만들어요."
    : "\n생성된 답변은 lib/experiment/part1Responses.json 에서 확인하고, 필요하면 --only로 다시 만드세요.",
);
process.exit(failed ? 1 : 0);
