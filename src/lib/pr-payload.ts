import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface PrAssessmentPayload {
  repository: string;
  prNumber: number;
  title: string;
  body: string;
  baseRef: string;
  headRef: string;
  headSha: string;
  labels: string[];
  changedFiles: string[];
  linesChanged: number;
  diff: string;
  diffTruncated: boolean;
  repoContext: string;
  rubric: string;
}

export function loadTextFile(path: string, fallback = ""): string {
  if (!existsSync(path)) return fallback;
  return readFileSync(path, "utf8").trim();
}

export function buildPayloadFromEnv(cwd = process.cwd()): PrAssessmentPayload {
  const payloadPath = process.env.PR_RISK_PAYLOAD_PATH ?? join(cwd, "pr-risk-payload.json");
  if (!existsSync(payloadPath)) {
    throw new Error(`Missing payload file: ${payloadPath}`);
  }

  const raw = JSON.parse(readFileSync(payloadPath, "utf8")) as Partial<PrAssessmentPayload>;

  const rubricPath = join(cwd, "context", "rubric-default.md");
  const repoContextPath = join(cwd, ".pr-risk", "context.md");

  return {
    repository: raw.repository ?? "unknown",
    prNumber: raw.prNumber ?? 0,
    title: raw.title ?? "",
    body: raw.body ?? "",
    baseRef: raw.baseRef ?? "main",
    headRef: raw.headRef ?? "",
    headSha: raw.headSha ?? "",
    labels: raw.labels ?? [],
    changedFiles: raw.changedFiles ?? [],
    linesChanged: raw.linesChanged ?? 0,
    diff: raw.diff ?? "",
    diffTruncated: raw.diffTruncated ?? false,
    repoContext: raw.repoContext ?? loadTextFile(repoContextPath),
    rubric: raw.rubric ?? loadTextFile(rubricPath),
  };
}

export function formatPayloadForAgent(payload: PrAssessmentPayload): string {
  return JSON.stringify(
    {
      repository: payload.repository,
      prNumber: payload.prNumber,
      title: payload.title,
      body: payload.body,
      baseRef: payload.baseRef,
      headRef: payload.headRef,
      headSha: payload.headSha,
      labels: payload.labels,
      changedFiles: payload.changedFiles,
      linesChanged: payload.linesChanged,
      diffTruncated: payload.diffTruncated,
      diff: payload.diff,
      repoContext: payload.repoContext || "(none)",
      rubric: payload.rubric,
    },
    null,
    2,
  );
}
