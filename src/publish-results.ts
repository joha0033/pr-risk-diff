#!/usr/bin/env node
/**
 * Publishes risk report to GitHub PR comment and check run.
 */
import { readFileSync, existsSync } from "node:fs";
import {
  CHECK_RUN_NAME,
  COMMENT_MARKER,
  riskReportSchema,
  unableToAssessReport,
} from "./schemas/risk-report.js";

const GITHUB_API = "https://api.github.com";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function githubFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers as Record<string, string>),
    },
  });
}

function formatCommentBody(report: ReturnType<typeof riskReportSchema.parse>): string {
  const tierLabel = report.tier.toUpperCase();
  const recs =
    report.recommendations.length > 0
      ? `\n\n### Recommendations\n${report.recommendations.map((r) => `- ${r}`).join("\n")}`
      : "";
  const factors =
    report.factors.length > 0
      ? `\n\n### Factors\n${report.factors.map((f) => `- **${f.id}** (${f.weight}): ${f.rationale}`).join("\n")}`
      : "";

  return `${COMMENT_MARKER}
## Risk Assessment (Advisory)

**Score:** ${report.score}/100 · **Tier:** ${tierLabel} · **Version:** ${report.assessmentVersion}

${report.summary}
${factors}${recs}

---
_Advisory only — does not block merge. Check name: **${CHECK_RUN_NAME}**._`;
}

async function upsertPrComment(
  owner: string,
  repo: string,
  prNumber: number,
  token: string,
  body: string,
): Promise<void> {
  const listRes = await githubFetch(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    token,
  );
  if (!listRes.ok) {
    throw new Error(`List comments failed: ${listRes.status} ${await listRes.text()}`);
  }
  const comments = (await listRes.json()) as Array<{ id: number; body?: string }>;
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));

  if (existing) {
    const patchRes = await githubFetch(
      `/repos/${owner}/${repo}/issues/comments/${existing.id}`,
      token,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      },
    );
    if (!patchRes.ok) {
      throw new Error(`Update comment failed: ${patchRes.status} ${await patchRes.text()}`);
    }
    return;
  }

  const createRes = await githubFetch(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
  if (!createRes.ok) {
    throw new Error(`Create comment failed: ${createRes.status} ${await createRes.text()}`);
  }
}

async function createCheckRun(
  owner: string,
  repo: string,
  headSha: string,
  token: string,
  report: ReturnType<typeof riskReportSchema.parse>,
): Promise<void> {
  const title = `${CHECK_RUN_NAME}: ${report.tier} (${report.score})`;
  const summary = report.summary.slice(0, 65535);

  const res = await githubFetch(`/repos/${owner}/${repo}/check-runs`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: CHECK_RUN_NAME,
      head_sha: headSha,
      status: "completed",
      conclusion: "neutral",
      output: {
        title,
        summary,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Create check run failed: ${res.status} ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  const token = requireEnv("GITHUB_TOKEN");
  const repository = requireEnv("GITHUB_REPOSITORY");
  const prNumber = Number(requireEnv("PR_NUMBER"));
  const headSha = requireEnv("HEAD_SHA");
  const reportPath = process.env.PR_RISK_REPORT_PATH ?? "risk-report.json";

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);

  let report;
  if (existsSync(reportPath)) {
    const raw = JSON.parse(readFileSync(reportPath, "utf8"));
    const parsed = riskReportSchema.safeParse(raw);
    report = parsed.success
      ? parsed.data
      : unableToAssessReport("Invalid report file on disk.");
  } else {
    report = unableToAssessReport("No risk report generated.");
  }

  const commentBody = formatCommentBody(report);
  await upsertPrComment(owner, repo, prNumber, token, commentBody);
  await createCheckRun(owner, repo, headSha, token, report);
  console.log("Published PR comment and check run.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
