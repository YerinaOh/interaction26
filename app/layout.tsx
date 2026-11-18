import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import { ExperimentProvider } from "@/lib/experiment/ExperimentProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 답변 선호도 조사",
  description: "두 AI의 답변을 비교하고, 더 마음에 드는 쪽을 골라 주세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f4f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ExperimentProvider>{children}</ExperimentProvider>
      </body>
    </html>
  );
}
