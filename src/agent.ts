import { LlmAgent } from "@google/adk";
import { riskReportJsonSchema } from "./schemas/risk-report.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRubric(): string {
  const path = join(__dirname, "..", "context", "rubric-default.md");
  return readFileSync(path, "utf8");
}

const rubric = loadRubric();

export const prRiskAgent = new LlmAgent({
  name: "pr_risk_agent",
  model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  description: "Assesses PR merge risk from diff and context (advisory).",
  instruction: `You are an expert PR risk assessor for AdCellerant repositories.

Use the balanced rubric and repo context in the user message. Return ONLY valid JSON matching the output schema.

Rules:
- Score 0-100 (higher = riskier). Apply balanced tier thresholds from rubric.
- List 3-6 factors with id, weight (0-1), and concise rationale citing paths when possible.
- summary must be markdown suitable for a GitHub PR comment (include score and tier in a heading).
- recommendations: 1-4 actionable bullets for reviewers.
- assessmentVersion must be "v1".
- Advisory only — do not say the PR is blocked.
- Docs-only or trivial changes should score low unless repo context says otherwise.

Rubric reference:
${rubric}`,
  outputSchema: riskReportJsonSchema,
  outputKey: "risk_report",
});

/** Root export for ADK api_server / devtools. */
export const rootAgent = prRiskAgent;
