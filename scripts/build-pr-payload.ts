#!/usr/bin/env node
/**
 * Builds pr-risk-payload.json from GitHub Actions env + gh CLI.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MAX_DIFF_CHARS } from "../src/lib/constants.js";

function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
}

function loadOptional(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8").trim() : "";
}

function main(): void {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const prNumber = process.env.PR_NUMBER ?? process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER;
  if (!prNumber) throw new Error("PR_NUMBER required");

  const prJson = gh(
    `pr view ${prNumber} --json title,body,baseRefName,headRefName,headRefOid,labels,files`,
  );
  const pr = JSON.parse(prJson) as {
    title: string;
    body: string;
    baseRefName: string;
    headRefName: string;
    headRefOid: string;
    labels: Array<{ name: string }>;
    files: Array<{ path: string; additions: number; deletions: number }>;
  };

  let diff = "";
  try {
    diff = gh(`pr diff ${prNumber}`);
  } catch {
    diff = "";
  }

  const diffTruncated = diff.length > MAX_DIFF_CHARS;
  if (diffTruncated) {
    diff = diff.slice(0, MAX_DIFF_CHARS);
  }

  const changedFiles = pr.files.map((f) => f.path);
  const linesChanged = pr.files.reduce(
    (sum, f) => sum + f.additions + f.deletions,
    0,
  );

  const cwd = process.cwd();
  const rubric = loadOptional(join(cwd, "context", "rubric-default.md"));
  const repoContext = loadOptional(join(cwd, ".pr-risk", "context.md"));

  const payload = {
    repository: repo,
    prNumber: Number(prNumber),
    title: pr.title,
    body: pr.body ?? "",
    baseRef: pr.baseRefName,
    headRef: pr.headRefName,
    headSha: pr.headRefOid,
    labels: pr.labels.map((l) => l.name),
    changedFiles,
    linesChanged,
    diff,
    diffTruncated,
    repoContext,
    rubric,
  };

  const out = process.env.PR_RISK_PAYLOAD_PATH ?? "pr-risk-payload.json";
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${out} (${changedFiles.length} files, diff ${diff.length} chars)`);
}

main();
