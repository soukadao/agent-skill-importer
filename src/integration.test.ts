import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadSkills, SkillError, ParseError } from "./index.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "skill-int-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true });
});

async function createSkill(basePath: string, name: string, content: string) {
  const skillDir = join(basePath, "skills", name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
}

describe("loadSkills", () => {
  it("should load a minimal skill", async () => {
    await createSkill(
      tmpDir,
      "my-skill",
      `---
name: my-skill
description: A simple test skill.
---

Do the thing.
`,
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toHaveLength(1);
    expect(skills[0]!.name).toBe("my-skill");
    expect(skills[0]!.description).toBe("A simple test skill.");
    expect(skills[0]!.content).toContain("Do the thing.");
    expect(skills[0]!.scope).toBe("project");
  });

  it("should load a skill with all fields", async () => {
    await createSkill(
      tmpDir,
      "full-skill",
      `---
name: full-skill
description: A skill with all optional fields.
license: MIT
compatibility: Requires Node.js 20+
metadata:
  author: test-org
  version: "2.0"
allowed-tools: Read Write Bash(git:*)
---

# Full Skill

Step 1: Do this.
Step 2: Do that.
`,
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toHaveLength(1);
    const skill = skills[0]!;
    expect(skill.name).toBe("full-skill");
    expect(skill.description).toBe("A skill with all optional fields.");
    expect(skill.license).toBe("MIT");
    expect(skill.compatibility).toBe("Requires Node.js 20+");
    expect(skill.metadata).toEqual({ author: "test-org", version: "2.0" });
    expect(skill.allowedTools).toEqual(["Read", "Write", "Bash(git:*)"]);
    expect(skill.content).toContain("# Full Skill");
  });

  it("should load multiple skills", async () => {
    await createSkill(
      tmpDir,
      "skill-a",
      "---\nname: skill-a\ndescription: Skill A.\n---\n",
    );
    await createSkill(
      tmpDir,
      "skill-b",
      "---\nname: skill-b\ndescription: Skill B.\n---\n",
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toHaveLength(2);
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(["skill-a", "skill-b"]);
  });

  it("should skip skills with missing description", async () => {
    await createSkill(
      tmpDir,
      "bad-skill",
      "---\nname: bad-skill\n---\n",
    );
    await createSkill(
      tmpDir,
      "good-skill",
      "---\nname: good-skill\ndescription: Valid.\n---\n",
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toHaveLength(1);
    expect(skills[0]!.name).toBe("good-skill");
  });

  it("should skip skills with missing name", async () => {
    await createSkill(
      tmpDir,
      "no-name",
      "---\ndescription: No name field.\n---\n",
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toEqual([]);
  });

  it("should skip skills without frontmatter", async () => {
    await createSkill(
      tmpDir,
      "no-fm",
      "# Just markdown\n\nNo frontmatter here.",
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toEqual([]);
  });

  it("should deduplicate by name and report collision (first path wins)", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "skill-int-"));
    try {
      await createSkill(
        tmpDir,
        "shared",
        "---\nname: shared\ndescription: From project.\n---\n",
      );
      await createSkill(
        tmpDir2,
        "shared",
        "---\nname: shared\ndescription: From user.\n---\n",
      );
      const { skills, collisions } = await loadSkills([
        { path: tmpDir, scope: "project" },
        { path: tmpDir2, scope: "user" },
      ]);
      expect(skills).toHaveLength(1);
      expect(skills[0]!.description).toBe("From project.");
      expect(skills[0]!.scope).toBe("project");

      expect(collisions).toHaveLength(1);
      expect(collisions[0]!.name).toBe("shared");
      expect(collisions[0]!.kept.scope).toBe("project");
      expect(collisions[0]!.shadowed.scope).toBe("user");
    } finally {
      await rm(tmpDir2, { recursive: true });
    }
  });

  it("should return empty result when no paths provided", async () => {
    const { skills, collisions } = await loadSkills([]);
    expect(skills).toEqual([]);
    expect(collisions).toEqual([]);
  });

  it("should return empty result when paths have no skills", async () => {
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills).toEqual([]);
  });

  it("should load from multiple paths with different scopes", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "skill-int-"));
    try {
      await createSkill(
        tmpDir,
        "skill-a",
        "---\nname: skill-a\ndescription: A.\n---\n",
      );
      await createSkill(
        tmpDir2,
        "skill-b",
        "---\nname: skill-b\ndescription: B.\n---\n",
      );
      const { skills } = await loadSkills([
        { path: tmpDir, scope: "project" },
        { path: tmpDir2, scope: "user" },
      ]);
      expect(skills).toHaveLength(2);
      expect(skills.find((s) => s.name === "skill-a")!.scope).toBe("project");
      expect(skills.find((s) => s.name === "skill-b")!.scope).toBe("user");
    } finally {
      await rm(tmpDir2, { recursive: true });
    }
  });

  it("should set location and baseDir correctly", async () => {
    await createSkill(
      tmpDir,
      "loc-test",
      "---\nname: loc-test\ndescription: Location test.\n---\n",
    );
    const { skills } = await loadSkills([{ path: tmpDir, scope: "project" }]);
    expect(skills[0]!.location).toBe(
      join(tmpDir, "skills", "loc-test", "SKILL.md"),
    );
    expect(skills[0]!.baseDir).toBe(
      join(tmpDir, "skills", "loc-test"),
    );
  });

  it("should report no collisions when names are unique", async () => {
    await createSkill(
      tmpDir,
      "unique",
      "---\nname: unique\ndescription: Unique.\n---\n",
    );
    const { collisions } = await loadSkills([
      { path: tmpDir, scope: "project" },
    ]);
    expect(collisions).toEqual([]);
  });

  it("should export error classes", () => {
    expect(SkillError).toBeDefined();
    expect(ParseError).toBeDefined();
    expect(new ParseError("test")).toBeInstanceOf(SkillError);
    expect(new ParseError("test")).toBeInstanceOf(Error);
  });
});
