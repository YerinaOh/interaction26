import type { ModelId } from "@/lib/experiment/models";

// 답변 한 개의 최대 글자 수 (공백 포함). 모바일 카드 한 장에 스크롤 없이 읽히는 분량.
export const MAX_ANSWER_CHARS = 300;

export const MIN_QUESTION_CHARS = 5;
export const MAX_QUESTION_CHARS = 200;

export type GenerationSource = "mock" | "live";

export interface GenerateRequest {
  question: string;
}

export interface GenerateResponse {
  answers: Record<ModelId, string>;
  source: GenerationSource;
}

export interface GenerateErrorResponse {
  error: string;
}

// 글자 수를 넘으면 마지막 문장 경계에서 자르고, 경계가 너무 앞이면 말줄임표로 끝낸다
export function clampAnswer(text: string, max = MAX_ANSWER_CHARS): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max);
  const cut = Math.max(...[".", "!", "?", "\n"].map((p) => head.lastIndexOf(p)));
  return cut >= max * 0.6 ? head.slice(0, cut + 1).trim() : `${head.slice(0, max - 1).trimEnd()}…`;
}
