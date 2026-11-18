import { CheckIcon } from "./icons";

interface ChoiceChipProps {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}

// 둥근 선택지. 고르면 포인트 색으로 채워지고, 복수 선택은 체크 표시가 붙는다.
export function ChoiceChip({ type, name, checked, onChange, children }: ChoiceChipProps) {
  return (
    <label
      className={`inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[15px] transition-colors select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        checked
          ? "bg-accent-soft font-semibold text-accent ring-[1.5px] ring-accent ring-inset"
          : "bg-surface text-ink-2 ring-1 ring-line ring-inset hover:bg-field"
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {type === "checkbox" && checked && <CheckIcon className="-ml-0.5 size-4" />}
      {children}
    </label>
  );
}
