interface TextAreaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  rows?: number;
  // 글자 수 옆(왼쪽)에 붙는 짧은 안내
  hint?: React.ReactNode;
}

// 자유 서술 칸. iOS Safari 확대 방지를 위해 16px 글자를 유지한다.
export function TextArea({ id, value, onChange, maxLength, placeholder = "자유롭게 적어 주세요", rows = 4, hint }: TextAreaProps) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="block w-full resize-none rounded-2xl bg-field p-4 text-base leading-relaxed text-ink outline-none transition-shadow placeholder:text-[#b0b8c1] focus:bg-surface focus:ring-2 focus:ring-accent"
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-muted">
        <span>{hint}</span>
        <span className="shrink-0 tabular-nums" aria-live="polite">
          <span className={value.length ? "text-ink-2" : ""}>{value.length}</span> / {maxLength}
        </span>
      </div>
    </div>
  );
}
