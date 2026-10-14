import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

describe("skills layout", () => {
  test("SKILL.md frontmatter has name and description", () => {
    const skillsDir = join(root, ".claude", "skills");
    expect(existsSync(skillsDir)).toBe(true);
    const names = readdirSync(skillsDir);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const skillPath = join(skillsDir, name, "SKILL.md");
      expect(existsSync(skillPath)).toBe(true);
      const text = readFileSync(skillPath, "utf8");
      expect(text.startsWith("---\n")).toBe(true);
      const end = text.indexOf("\n---\n", 4);
      expect(end).toBeGreaterThan(0);
      const fm = text.slice(4, end);
      expect(fm).toMatch(/^name:\s+\S+/m);
      expect(fm).toMatch(/^description:\s+/m);
    }
  });

  test("no .cursor/skills or .agents/skills mirrors", () => {
    expect(existsSync(join(root, ".cursor", "skills"))).toBe(false);
    expect(existsSync(join(root, ".agents", "skills"))).toBe(false);
  });
});
