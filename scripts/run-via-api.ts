#!/usr/bin/env node
/**
 * Phase 2 hybrid: invoke central ADK API server /run endpoint.
 */
import { writeFileSync } from "node:fs";
import { buildPayloadFromEnv, formatPayloadForAgent } from "../src/lib/pr-payload.js";
import { MAX_DIFF_CHARS } from "../src/lib/constants.js";
import {
  riskReportSchema,
  unableToAssessReport,
  RISK_ASSESSMENT_VERSION,
} from "../src/schemas/risk-report.js";
import { applyDeterministicGuardrails } from "../src/lib/scoring-guardrails.js";

async function main(): Promise<void> {
  const apiUrl = process.env.PR_RISK_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.PR_RISK_API_KEY;
  const outPath = process.env.PR_RISK_REPORT_PATH ?? "risk-report.json";
  const appName = process.env.PR_RISK_APP_NAME ?? "pr_risk_diff";

  if (!apiUrl) throw new Error("PR_RISK_API_URL is required for remote API mode");

  const payload = buildPayloadFromEnv();

  if (payload.diff.length > MAX_DIFF_CHARS) {
    const report = unableToAssessReport(
      `Diff exceeds ${MAX_DIFF_CHARS} characters (fail-open policy).`,
    );
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    return;
  }

  const sessionId = `pr-${payload.repository}-${payload.prNumber}-${payload.headSha}`;

  await fetch(`${apiUrl}/apps/${appName}/users/ci/sessions/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    },
    body: JSON.stringify({}),
  }).catch(() => {
    /* session may already exist */
  });

  const runRes = await fetch(`${apiUrl}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    },
    body: JSON.stringify({
      appName,
      userId: "ci",
      sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: formatPayloadForAgent(payload) }],
      },
    }),
  });

  if (!runRes.ok) {
    throw new Error(`API /run failed: ${runRes.status} ${await runRes.text()}`);
  }

  const events = (await runRes.json()) as Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;

  const last = events.at(-1);
  const text = last?.content?.parts?.map((p) => p.text).filter(Boolean).join("") ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    writeFileSync(
      outPath,
      JSON.stringify(unableToAssessReport("Remote API returned non-JSON."), null, 2),
    );
    process.exitCode = 1;
    return;
  }

  const validated = riskReportSchema.safeParse(parsed);
  if (!validated.success) {
    writeFileSync(
      outPath,
      JSON.stringify(
        unableToAssessReport(`Remote validation failed: ${validated.error.message}`),
        null,
      ),
    );
    process.exitCode = 1;
    return;
  }

  if (validated.data.assessmentVersion !== RISK_ASSESSMENT_VERSION) {
    writeFileSync(
      outPath,
      JSON.stringify(unableToAssessReport("Unexpected assessment version."), null, 2),
    );
    process.exitCode = 1;
    return;
  }

  const report = applyDeterministicGuardrails(validated.data, payload);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
