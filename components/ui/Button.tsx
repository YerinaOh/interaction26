import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong active:bg-accent-strong disabled:bg-[#e5e8eb] disabled:text-[#b0b8c1]",
  // 흰 바탕·회색 바탕 어디에 놓여도 버튼으로 보이도록 흰 채움 + 테두리
  secondary: "bg-surface text-ink ring-1 ring-line ring-inset hover:bg-field active:bg-field disabled:text-[#b0b8c1]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-14 w-full items-center justify-center gap-1.5 rounded-2xl px-5 text-[16px] font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

// 버튼 아래에 붙는 짧은 안내 (비활성 이유 등)
export function ButtonHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2.5 text-center text-[13px] text-muted">{children}</p>;
}
