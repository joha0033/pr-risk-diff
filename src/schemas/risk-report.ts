import { z } from "zod";

export const RISK_ASSESSMENT_VERSION = "v1";
export const CHECK_RUN_NAME = "Risk Assessment";
export const COMMENT_MARKER = "<!-- pr-risk-assessment -->";

export const riskFactorSchema = z.object({
  id: z.string(),
  weight: z.number().min(0).max(1),
  rationale: z.string(),
});

export const riskReportSchema = z.object({
  score: z.number().min(0).max(100),
  tier: z.enum(["low", "medium", "high", "critical"]),
  factors: z.array(riskFactorSchema),
  summary: z.string(),
  recommendations: z.array(z.string()),
  assessmentVersion: z.literal(RISK_ASSESSMENT_VERSION),
});

export type RiskReport = z.infer<typeof riskReportSchema>;
export type RiskFactor = z.infer<typeof riskFactorSchema>;

export const unableToAssessReport = (reason: string): RiskReport => ({
  score: 0,
  tier: "low",
  factors: [
    {
      id: "unable-to-assess",
      weight: 0,
      rationale: reason,
    },
  ],
  summary: `## Risk Assessment (Advisory)\n\n**Unable to assess** — ${reason}\n\n_This check is advisory only and does not block merge._`,
  recommendations: ["Retry after reducing PR size or splitting the change."],
  assessmentVersion: RISK_ASSESSMENT_VERSION,
});

import { Type, type Schema } from "@google/genai";

export const riskReportJsonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Risk score from 0 (lowest) to 100 (highest).",
    },
    tier: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
      description: "Risk tier derived from balanced rubric thresholds.",
    },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          weight: { type: Type.NUMBER },
          rationale: { type: Type.STRING },
        },
        required: ["id", "weight", "rationale"],
      },
    },
    summary: {
      type: Type.STRING,
      description: "Markdown summary for PR comment body.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    assessmentVersion: {
      type: Type.STRING,
      enum: [RISK_ASSESSMENT_VERSION],
    },
  },
  required: [
    "score",
    "tier",
    "factors",
    "summary",
    "recommendations",
    "assessmentVersion",
  ],
};
