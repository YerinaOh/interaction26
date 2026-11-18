// 스크립트 공용 도우미

export function requireApiKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return;
  console.error(`❌ ANTHROPIC_API_KEY가 없어 실행할 수 없어요.

프로젝트 폴더에 .env.local 파일을 만들고 아래 한 줄을 넣은 뒤 다시 실행해 주세요.
  ANTHROPIC_API_KEY=sk-ant-...

키는 https://console.anthropic.com 의 API Keys 메뉴에서 발급할 수 있어요.`);
  process.exit(1);
}

// --name=value 형태의 인자를 읽는다
export function argValue(args: string[], name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}
