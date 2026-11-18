import type { ModelId } from "@/lib/experiment/models";
import { clampAnswer } from "./shared";

// API 키 없이 흐름을 시험할 때 쓰는 가짜 답변. 두 답변의 말투와 길이를 일부러 다르게 둔다.
export function mockAnswers(question: string): Record<ModelId, string> {
  const topic = question.length > 40 ? `${question.slice(0, 40)}…` : question;
  return {
    opus: clampAnswer(
      `(테스트용 가짜 답변) “${topic}”에 대해 정리해 볼게요.\n\n먼저 상황에 따라 답이 달라질 수 있다는 점을 짚고 싶어요. 일반적으로는 목적과 조건을 먼저 정하고, 그에 맞는 선택지를 두세 개로 좁혀 비교하는 방식이 가장 효과적입니다.\n\n조건을 조금 더 알려 주시면 더 구체적으로 도와드릴게요.`,
    ),
    haiku: clampAnswer(
      `(테스트용 가짜 답변) “${topic}”에 대한 답변입니다.\n\n핵심은 목적을 분명히 하는 것입니다. 그다음 가능한 방법을 비교해 보고, 가장 현실적인 것부터 시도해 보세요.`,
    ),
  };
}
