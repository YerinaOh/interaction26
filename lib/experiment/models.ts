export type Choice = "A" | "B";
export type ModelId = "opus" | "haiku";

export const MODEL_NAMES: Record<ModelId, string> = {
  opus: "Claude Opus 5.5",
  haiku: "Claude Haiku 5.5",
};

// M-08 결과 화면의 모델 소개 문구 (PPT에서는 "어쩌고 저쩌고"로 비어 있던 자리)
export const MODEL_BLURBS: Record<ModelId, string> = {
  opus: "Claude Opus 5.5는 Anthropic의 상위 모델로, 복잡한 추론과 꼼꼼한 설명에 강해요.",
  haiku: "Claude Haiku 5.5는 빠르고 가벼운 모델로, 핵심만 간결하게 답하는 데 강해요.",
};

// 화면 라벨과 실제 모델의 대응은 세션마다 무작위로 정해진다 → assignment.ts 의 slotMapping()
