import type { PrAssessmentPayload } from "./pr-payload.js";
import type { RiskReport } from "../schemas/risk-report.js";
import { TIER_THRESHOLDS } from "./constants.js";

const HIGH_RISK_PATH_PATTERNS = [
  /\/migrations?\//i,
  /prisma\/schema/i,
  /\/auth\//i,
  /\.github\/workflows\//i,
  /terraform/i,
  /helm\//i,
  /payment/i,
  /billing/i,
];

export function applyDeterministicGuardrails(
  report: RiskReport,
  payload: PrAssessmentPayload,
): RiskReport {
  let score = report.score;
  const extraFactors = [...report.factors];

  if (payload.changedFiles.length >= 50) {
    score = Math.min(100, score + 8);
    extraFactors.push({
      id: "large-file-count",
      weight: 0.08,
      rationale: `${payload.changedFiles.length} files changed (guardrail bump).`,
    });
  }

  if (payload.linesChanged >= 2000) {
    score = Math.min(100, score + 10);
    extraFactors.push({
      id: "large-line-count",
      weight: 0.1,
      rationale: `~${payload.linesChanged} lines changed (guardrail bump).`,
    });
  }

  const hotPaths = payload.changedFiles.filter((f) =>
    HIGH_RISK_PATH_PATTERNS.some((re) => re.test(f)),
  );
  if (hotPaths.length > 0) {
    score = Math.min(100, score + 12);
    extraFactors.push({
      id: "hot-path-touched",
      weight: 0.12,
      rationale: `Hot paths: ${hotPaths.slice(0, 5).join(", ")}${hotPaths.length > 5 ? "…" : ""}`,
    });
  }

  const tier = scoreToTier(score);

  return {
    ...report,
    score: Math.round(score),
    tier,
    factors: extraFactors,
  };
}

export function scoreToTier(score: number): RiskReport["tier"] {
  if (score <= TIER_THRESHOLDS.low) return "low";
  if (score <= TIER_THRESHOLDS.medium) return "medium";
  if (score <= TIER_THRESHOLDS.high) return "high";
  return "critical";
}
