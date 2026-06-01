import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreToTier } from "./scoring-guardrails.js";

describe("scoreToTier", () => {
  it("maps balanced thresholds", () => {
    assert.equal(scoreToTier(10), "low");
    assert.equal(scoreToTier(25), "low");
    assert.equal(scoreToTier(40), "medium");
    assert.equal(scoreToTier(60), "high");
    assert.equal(scoreToTier(90), "critical");
  });
});
