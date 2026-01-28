import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const SKILLS_DIR = join(__dirname, "..");

describe("Research Skills Directory Structure", () => {
  const requiredSkills = [
    "youtube-search",
    "reddit-search",
    "github-search",
    "web-search",
  ];

  describe("skill directories exist", () => {
    requiredSkills.forEach((skill) => {
      it(`${skill}/ directory exists`, () => {
        const skillDir = join(SKILLS_DIR, skill);
        expect(existsSync(skillDir)).toBe(true);
      });
    });
  });

  describe("SKILL.md files exist", () => {
    requiredSkills.forEach((skill) => {
      it(`${skill}/SKILL.md exists`, () => {
        const skillFile = join(SKILLS_DIR, skill, "SKILL.md");
        expect(existsSync(skillFile)).toBe(true);
      });
    });
  });
});
