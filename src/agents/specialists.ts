import { LlmAgent } from "@google/adk";
import { riskReportJsonSchema } from "../schemas/risk-report.js";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

/** Analyzes diff paths and change magnitude. */
export const diffAnalyzerAgent = new LlmAgent({
  name: "diff_analyzer",
  model: MODEL,
  description: "Analyzes PR diff for risky paths and blast radius.",
  instruction: `Analyze the PR payload JSON in the user message.
Output a short JSON object: { "signals": string[], "notes": string }.
Focus on migrations, auth, infra, large churn. No tools.`,
  outputKey: "diff_analysis",
});

/** Applies stack/repo context playbooks. */
export const stackRiskAgent = new LlmAgent({
  name: "stack_risk",
  model: MODEL,
  description: "Applies stack and repo context to risk signals.",
  instruction: `Use rubric and repoContext from the PR payload.
Prior analysis (if any): {diff_analysis}
Output JSON: { "stackSignals": string[], "notes": string }`,
  outputKey: "stack_analysis",
});

/** Synthesizes final advisory risk report. */
export const riskSynthesizerAgent = new LlmAgent({
  name: "risk_synthesizer",
  model: MODEL,
  description: "Produces final PR risk score and markdown summary.",
  instruction: `Synthesize diff_analysis and stack_analysis from session with the PR payload.
Return ONLY JSON matching output schema (balanced rubric, v1, advisory only).`,
  outputSchema: riskReportJsonSchema,
  outputKey: "risk_report",
});
