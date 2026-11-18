"use client";

import { useEffect } from "react";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { ConsentScreen } from "./screens/ConsentScreen";
import { PreSurveyScreen } from "./screens/PreSurveyScreen";
import { ChoiceScreen } from "./screens/ChoiceScreen";
import { RatingScreen } from "./screens/RatingScreen";
import { QuestionInputScreen } from "./screens/QuestionInputScreen";
import { GeneratingScreen } from "./screens/GeneratingScreen";
import { FinalCheckScreen } from "./screens/FinalCheckScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { PostSurveyScreen } from "./screens/PostSurveyScreen";
import { CompleteScreen } from "./screens/CompleteScreen";

export function ExperimentFlow() {
  const { step, stepIndex } = useExperiment();

  // 단계가 바뀌면 새 화면을 맨 위부터 보여준다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stepIndex]);

  switch (step.screen) {
    case "M-01":
      return <ConsentScreen />;
    case "M-02":
      return <PreSurveyScreen />;
    case "M-03":
      return <ChoiceScreen key={stepIndex} step={step} />;
    case "M-04":
      return <RatingScreen key={stepIndex} step={step} />;
    case "M-05":
      return <QuestionInputScreen key={stepIndex} step={step} />;
    case "M-06":
      return <GeneratingScreen key={stepIndex} step={step} />;
    case "M-07":
      return <FinalCheckScreen />;
    case "M-08":
      return <RevealScreen />;
    case "M-09":
      return <PostSurveyScreen />;
    case "END":
      return <CompleteScreen />;
  }
}
