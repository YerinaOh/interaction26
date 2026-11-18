// 라운드 상단의 과업 유형 + 프롬프트
export function TaskPrompt({ taskType, prompt }: { taskType: string; prompt: string }) {
  return (
    <div className="rounded-3xl bg-surface p-5">
      <span className="inline-flex h-6 items-center rounded-md bg-accent-soft px-2 text-[12px] font-semibold text-accent">{taskType}</span>
      <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-line text-ink">{prompt}</p>
    </div>
  );
}
