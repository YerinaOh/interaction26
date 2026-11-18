interface QuestionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

// 설문 문항 하나를 흰 카드로 감싼다: 번호 + 질문, 아래에 응답 컨트롤
export function Question({ number, title, children }: QuestionProps) {
  return (
    <fieldset className="rounded-3xl bg-surface p-5">
      <legend className="float-left w-full text-[16px] leading-snug font-semibold text-ink">
        <span className="mr-1.5 text-accent">Q{number}</span>
        {title}
      </legend>
      <div className="clear-both pt-4">{children}</div>
    </fieldset>
  );
}
