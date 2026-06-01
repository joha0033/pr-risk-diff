import { SequentialAgent } from "@google/adk";
import {
  diffAnalyzerAgent,
  stackRiskAgent,
  riskSynthesizerAgent,
} from "./specialists.js";

/**
 * Phase 3 multi-agent pipeline (opt-in via USE_MULTI_AGENT=true).
 */
export const prRiskOrchestrator = new SequentialAgent({
  name: "pr_risk_orchestrator",
  description: "Sequential PR risk pipeline: diff → stack → synthesize.",
  subAgents: [diffAnalyzerAgent, stackRiskAgent, riskSynthesizerAgent],
});
