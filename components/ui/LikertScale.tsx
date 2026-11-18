const POINTS = [1, 2, 3, 4, 5, 6, 7] as const;

interface LikertScaleProps {
  name: string;
  value?: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
}

// 7점 척도: 숫자가 적힌 버튼 일곱 개 + 양끝 라벨 (M-02, M-04, M-07, M-09 공용)
export function LikertScale({ name, value, onChange, minLabel, maxLabel }: LikertScaleProps) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {POINTS.map((point) => {
          const selected = value === point;
          return (
            <label
              key={point}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums transition-colors select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                selected ? "bg-accent text-white" : "bg-field text-ink-2 hover:bg-[#e5e8eb]"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={point}
                checked={selected}
                onChange={() => onChange(point)}
                aria-label={`${point}점`}
                className="sr-only"
              />
              {point}
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
