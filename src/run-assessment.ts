#!/usr/bin/env node
/**
 * Runs PR risk assessment locally or in CI.
 * Writes report JSON to PR_RISK_REPORT_PATH (default: risk-report.json).
 */
import { writeFileSync } from "node:fs";
import {
  InMemoryRunner,
  isFinalResponse,
  stringifyContent,
} from "@google/adk";
import { rootAgent } from "./root-agent.js";
import {
  buildPayloadFromEnv,
  formatPayloadForAgent,
} from "./lib/pr-payload.js";
import { MAX_DIFF_CHARS } from "./lib/constants.js";
import {
  riskReportSchema,
  unableToAssessReport,
} from "./schemas/risk-report.js";
import { applyDeterministicGuardrails } from "./lib/scoring-guardrails.js";

async function main(): Promise<void> {
  const payload = buildPayloadFromEnv();
  const outPath = process.env.PR_RISK_REPORT_PATH ?? "risk-report.json";

  if (payload.diff.length > MAX_DIFF_CHARS) {
    const report = unableToAssessReport(
      `Diff exceeds ${MAX_DIFF_CHARS} characters (fail-open policy).`,
    );
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    return;
  }

  const runner = new InMemoryRunner({
    agent: rootAgent,
    appName: "pr_risk_diff",
  });

  const session = await runner.sessionService.createSession({
    appName: runner.appName,
    userId: "ci",
  });

  const newMessage = {
    role: "user" as const,
    parts: [{ text: formatPayloadForAgent(payload) }],
  };

  let finalText = "";
  for await (const event of runner.runAsync({
    userId: session.userId,
    sessionId: session.id,
    newMessage,
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(finalText);
  } catch {
    const report = unableToAssessReport("Agent did not return valid JSON.");
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const validated = riskReportSchema.safeParse(parsed);
  if (!validated.success) {
    const report = unableToAssessReport(
      `Agent output failed validation: ${validated.error.message}`,
    );
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const report = applyDeterministicGuardrails(validated.data, payload);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
