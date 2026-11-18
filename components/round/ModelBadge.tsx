import { MODEL_NAMES, type ModelId } from "@/lib/experiment/models";

const VARIANTS = {
  outline: "bg-field text-ink-2",
  muted: "bg-field text-muted",
  // 결과 공개 화면에서 '실제 모델'을 강조할 때
  solid: "bg-accent text-white",
} as const;

// 응답 카드 오른쪽 위의 모델명 배지. A·B 카드는 항상 같은 모양을 써야 비교가 공정하다.
export function ModelBadge({
  model,
  muted = false,
  variant = muted ? "muted" : "outline",
}: {
  model: ModelId;
  muted?: boolean;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold whitespace-nowrap ${VARIANTS[variant]}`}
    >
      {MODEL_NAMES[model]}
    </span>
  );
}
