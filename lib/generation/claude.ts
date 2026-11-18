// 서버 전용: 실제 Claude 모델 두 개에 같은 질문을 동시에 보낸다.
// Part 2 실시간 생성(/api/generate)과 Part 1 고정 답변 생성 스크립트가 함께 쓴다.
import Anthropic from "@anthropic-ai/sdk";
import type { ModelId } from "@/lib/experiment/models";
import { MAX_ANSWER_CHARS, clampAnswer } from "./shared";

export const MODEL_IDS: Record<ModelId, string> = {
  opus: "claude-opus-5-5",
  haiku: "claude-haiku-5-5",
};

// 두 모델에 똑같은 지시를 줘서 조건 차이는 모델 자체뿐이게 한다.
// 모델이 스스로 이름을 밝히면 화면의 라벨 조작이 드러나므로 정체 언급을 막는다.
function systemPrompt(maxChars: number): string {
  return `사용자의 요청에 한국어로 답하세요.
- 공백 포함 ${maxChars}자 이내로 답하세요.
- 마크다운 문법(#, **, 표, 코드 블록)을 쓰지 말고 평문으로 쓰세요. 문단은 줄바꿈으로 나누세요.
- 자신이 어느 회사의 어떤 AI 모델인지 언급하지 마세요. 정체를 물으면 "AI 어시스턴트"라고만 답하세요.`;
}

export class RefusalError extends Error {
  constructor(public model: ModelId) {
    super(`${model} declined to answer`);
  }
}

// 오류를 던진 것과 같은 SDK 인스턴스로 판별해야 하므로 여기서 검사한다
// (스크립트 실행기 tsx가 SDK를 경로별로 따로 불러오면 바깥의 instanceof가 어긋난다)
export function isAuthenticationError(error: unknown): boolean {
  return error instanceof Anthropic.AuthenticationError;
}

export interface ModelAnswer {
  text: string; // 글자 수 제한까지 적용한 최종 답변
  rawLength: number; // 자르기 전 길이 — 제한을 넘겼는지 확인용
}

// mock 모드에서는 키 없이도 서버가 떠야 하므로 처음 쓸 때 만든다
let client: Anthropic | undefined;
const getClient = () => (client ??= new Anthropic());

// 혹시 남은 마크다운 기호를 걷어낸다
function toPlainText(text: string): string {
  return text
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

export type Effort = NonNullable<Anthropic.OutputConfig["effort"]>;

export interface AskOptions {
  maxChars?: number;
  // 두 모델에 항상 같은 값을 써야 조건이 같아진다. 높을수록 깊이 생각하지만 느려진다.
  effort?: Effort;
}

// 실시간 생성(Part 2)의 기본 effort. 모바일 대기 시간 때문에 낮게 두고, 필요하면 환경 변수로 올린다.
export const LIVE_EFFORT: Effort = (process.env.GENERATION_EFFORT as Effort | undefined) ?? "low";

export async function ask(model: ModelId, question: string, { maxChars = MAX_ANSWER_CHARS, effort = "low" }: AskOptions = {}): Promise<ModelAnswer> {
  const response = await getClient().messages.create({
    model: MODEL_IDS[model],
    // 생각(thinking) 토큰도 여기에 포함되므로 넉넉히 둔다. 답변 길이는 지시문과 clampAnswer로 제한한다.
    max_tokens: 16000,
    output_config: { effort },
    system: systemPrompt(maxChars),
    messages: [{ role: "user", content: question }],
  });

  // 거절된 답변을 다른 모델로 대체(fallback)하지 않는다. 실제 모델 기록이 틀어지기 때문.
  if (response.stop_reason === "refusal") throw new RefusalError(model);

  const text = toPlainText(
    response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(""),
  );
  return { text: clampAnswer(text, maxChars), rawLength: text.length };
}

export async function liveAnswers(question: string, maxChars = MAX_ANSWER_CHARS): Promise<Record<ModelId, string>> {
  const options = { maxChars, effort: LIVE_EFFORT };
  const [opus, haiku] = await Promise.all([ask("opus", question, options), ask("haiku", question, options)]);
  return { opus: opus.text, haiku: haiku.text };
}

// 심사 결과 등 JSON 응답이 필요할 때 쓴다. 출력은 schema에 맞게 강제된다.
export async function askJson<T>(
  modelId: string,
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
  effort: Effort = "medium",
): Promise<T> {
  const response = await getClient().messages.create({
    model: modelId,
    max_tokens: 16000,
    output_config: { effort, format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error(`${modelId} declined to judge`);
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return JSON.parse(text) as T;
}
