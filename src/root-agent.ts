import { prRiskAgent } from "./agent.js";
import { prRiskOrchestrator } from "./agents/orchestrator.js";

/**
 * ADK api_server entry: `npx adk api_server src/root-agent.ts`
 * Set USE_MULTI_AGENT=true to use SequentialAgent pipeline.
 */
export const rootAgent =
  process.env.USE_MULTI_AGENT === "true" ? prRiskOrchestrator : prRiskAgent;
