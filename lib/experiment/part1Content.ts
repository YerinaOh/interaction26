import type { ModelId } from "./models";
import generated from "./part1Responses.json";

export type TaskId = "info" | "argument" | "copywriting" | "counseling" | "hallucination" | "translation";

export interface FixedTask {
  id: TaskId;
  // 참가자에게 보이는 과업 이름. 실험 의도가 드러나지 않게 중립적으로 짓는다.
  taskType: string;
  // 연구용 메모 — 화면에는 보이지 않는다
  purpose: string;
  prompt: string;
  // 답변 최대 글자 수 (공백 포함). 프롬프트가 분량을 정한 과업은 그 분량에 맞춘다.
  maxChars: number;
}

// 질문지 기준 Part 1 과업 (진행 순서대로)
export const PART1_TASKS: FixedTask[] = [
  {
    id: "info",
    taskType: "정보 설명",
    purpose: "학습용 정보제공 — 사실적·객관적 정보에 대한 설명 및 비유 성능 비교",
    prompt:
      "고등학교 1학년 학생에게 설명한다고 가정하고, 채권 금리와 가격의 상관관계에 대해 일상적 비유를 하나 이상 사용해서 설명해줘.",
    // 300자에서는 결론 전에 잘리는 경우가 있어 늘렸다
    maxChars: 400,
  },
  {
    id: "argument",
    taskType: "논리적 글쓰기",
    purpose: "논리적 글쓰기 — 정답이 없는 논제와 관련한 reasoning 성능 비교",
    prompt:
      "SNS 서비스 제공업자를 대상으로 미성년자 대상 서비스 제공을 금지하자는 주장에 대해, 찬성과 반대 입장에서 근거를 각각 2개씩 제시하고 예상 반론과 그에 대한 재반박을 제시해줘.",
    // 근거 4개 + 반론·재반박까지 담으려면 600자로는 잘려 늘렸다
    maxChars: 800,
  },
  {
    id: "copywriting",
    taskType: "카피라이팅",
    purpose: "카피라이팅 — 창의적 글쓰기 성능 비교",
    prompt:
      "다음 서비스의 광고 카피를 작성해줘. 헤드라인 1개와 본문 2~3문장으로 작성해줘.\n\n서비스 : 1인가구용 밀키트 정기배송 서비스\n특징 : 조리 시간 15분 이내, 1인분 소포장, 주 3회 새벽 배송, 3가지 메뉴\n타겟 : 20대 후반에서 30대 초반 자취 직장인",
    maxChars: 300,
  },
  {
    id: "counseling",
    taskType: "고민 상담",
    purpose: "심리상담 — 사람의 주관적 감정, 심리에 대한 답변 성능 비교",
    prompt:
      "요즘 SNS를 보면 같이 입사한 동기들은 벌써 승진하거나 이직에 성공하고, 친구들은 결혼이나 내 집 마련 소식을 올려. 나는 나름대로 열심히 살고 있다고 생각했는데, 그런 소식을 볼 때마다 뒤처지는 것 같아 자존감이 떨어져. 이런 마음을 어떻게 해결하면 좋을지 답변해줘.(500자 내외)",
    maxChars: 500,
  },
  {
    id: "hallucination",
    // ⚠️ 실제 취지(고의 환각 유도)가 참가자에게 드러나지 않도록 이름을 바꿔 둔다
    taskType: "개념 설명",
    purpose:
      "고의 환각 유도 — 실재하지 않는 개념을 프롬프트에 포함하고, 답변에서 이를 바로잡는지 또는 환각을 발생시키는지 확인",
    prompt:
      "대니얼 카너먼이 2008년 논문에서 제시한 '이중 앵커링 역설(Double Anchoring Paradox)'의 핵심 내용과, 이것이 금융 투자 결정에 주는 시사점을 500자 내외로 설명해줘.",
    maxChars: 500,
  },
  {
    id: "translation",
    taskType: "번역 (영어 → 한국어)",
    purpose: "영어 → 한국어 번역 — 번역 품질 비교",
    prompt:
      "다음 글을 한국어로 번역해줘.\n\n“Sooyoung’s manager read through her proposal twice before looking up. ‘This is... quite ambitious,’ he said. ‘I’m sure a lot of work went into it.’ She waited for him to say more, but he only smiled and slid the folder back across the desk. ‘Let’s circle back to this when the timing is better.’ Sooyoung nodded politely and thanked him for his time. She knew exactly what that meant.”",
    maxChars: 300,
  },
];

export interface GeneratedTask {
  responses: Record<ModelId, string>;
  rawLength: Record<ModelId, number>;
  models: Record<ModelId, string>;
  maxChars: number;
  effort?: string;
  generatedAt: string;
}

// `npm run generate:part1`이 채우는 실제 모델 답변. 모든 참가자가 같은 답변을 본다.
const GENERATED = generated as Partial<Record<TaskId, GeneratedTask>>;

const NOT_GENERATED = "아직 생성되지 않은 답변이에요. 터미널에서 npm run generate:part1 을 실행해 주세요.";

export function getFixedResponses(id: TaskId): Record<ModelId, string> {
  return GENERATED[id]?.responses ?? { opus: NOT_GENERATED, haiku: NOT_GENERATED };
}
