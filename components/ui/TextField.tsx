import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  onChange: (value: string) => void;
}

// 위에 라벨, 아래에 회색 채움 입력칸
export function TextField({ label, id, onChange, className = "", ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        onChange={(e) => onChange(e.target.value)}
        // iOS Safari는 16px 미만 입력칸에 포커스하면 화면을 확대하므로 text-base 이상을 유지한다
        className={`h-14 w-full min-w-0 rounded-2xl bg-field px-4 text-base text-ink outline-none transition-shadow placeholder:text-[#b0b8c1] focus:bg-surface focus:ring-2 focus:ring-accent ${className}`}
        {...props}
      />
    </div>
  );
}
