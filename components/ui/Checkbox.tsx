import { CheckIcon } from "./icons";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  strong?: boolean; // '전체 동의'처럼 굵게 보여줄 항목
}

// 둥근 체크 표시 + 문구 한 줄. 줄 전체를 눌러도 체크된다.
export function Checkbox({ checked, onChange, children, strong = false }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2.5 select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={`mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
          checked ? "bg-accent text-white" : "bg-[#e5e8eb] text-white"
        }`}
        aria-hidden
      >
        <CheckIcon className="size-3.5" />
      </span>
      <span className={`text-[15px] leading-snug ${strong ? "font-semibold text-ink" : "text-ink-2"}`}>{children}</span>
    </label>
  );
}
