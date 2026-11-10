import { describe, it, expect } from "vitest";
import { findBadWords, STRIKES_BEFORE_SUSPEND } from "../components/fly/autoModeration";
import { ageOn } from "../components/fly/fieldPrivacy";
describe("auto moderation", () => {
  it("flags abusive words", () => expect(findBadWords("tui ekta khanki").length).toBeGreaterThan(0));
  it("allows clean text", () => expect(findBadWords("শুভ সকাল সবাইকে")).toEqual([]));
  it("suspends after 3 strikes", () => expect(STRIKES_BEFORE_SUSPEND).toBe(3));
  it("computes birthday age", () => expect(ageOn("2003-11-10", new Date(2026, 10, 10))).toBe(23));
});
