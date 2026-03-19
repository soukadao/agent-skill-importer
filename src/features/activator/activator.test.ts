import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { activate } from "./activator.js";
import type { Skill } from "../../shared/types.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "activator-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true });
});

function makeSkill(
  name: string,
  baseDir: string,
  overrides?: Partial<Skill>,
): Skill {
  return {
    name,
    description: `Skill ${name}.`,
    license: null,
    compatibility: null,
    metadata: {},
    allowedTools: [],
    content: `# ${name}\n\nInstructions here.`,
    location: join(baseDir, "SKILL.md"),
    baseDir,
    scope: "project",
    ...overrides,
  };
}

describe("activate", () => {
  it("should return null for unknown skill name", async () => {
    const result = await activate([], "nonexistent");
    expect(result).toBeNull();
  });

  it("should return skill detail without resources", async () => {
    const skillDir = join(tmpDir, "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\nname: my-skill\n---\n");

    const skill = makeSkill("my-skill", skillDir);
    const result = await activate([skill], "my-skill");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("my-skill");
    expect(result!.content).toContain("# my-skill");
    expect(result!.resources).toEqual([]);
  });

  it("should list resource files", async () => {
    const skillDir = join(tmpDir, "with-resources");
    await mkdir(join(skillDir, "scripts"), { recursive: true });
    await mkdir(join(skillDir, "references"), { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "skill content");
    await writeFile(join(skillDir, "scripts", "extract.py"), "# python");
    await writeFile(join(skillDir, "references", "guide.md"), "# guide");

    const skill = makeSkill("with-resources", skillDir);
    const result = await activate([skill], "with-resources");

    expect(result).not.toBeNull();
    expect(result!.resources).toEqual([
      "references/guide.md",
      "scripts/extract.py",
    ]);
  });

  it("should exclude SKILL.md from resources", async () => {
    const skillDir = join(tmpDir, "exclude-skill-md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "content");
    await writeFile(join(skillDir, "helper.sh"), "#!/bin/bash");

    const skill = makeSkill("exclude-skill-md", skillDir);
    const result = await activate([skill], "exclude-skill-md");

    expect(result!.resources).toEqual(["helper.sh"]);
  });

  it("should scan nested directories", async () => {
    const skillDir = join(tmpDir, "nested");
    await mkdir(join(skillDir, "assets", "templates"), { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "content");
    await writeFile(
      join(skillDir, "assets", "templates", "doc.html"),
      "<html>",
    );
    await writeFile(join(skillDir, "assets", "logo.png"), "png-data");

    const skill = makeSkill("nested", skillDir);
    const result = await activate([skill], "nested");

    expect(result!.resources).toEqual([
      "assets/logo.png",
      "assets/templates/doc.html",
    ]);
  });

  it("should skip .git and node_modules in resources", async () => {
    const skillDir = join(tmpDir, "skip-dirs");
    await mkdir(join(skillDir, ".git"), { recursive: true });
    await mkdir(join(skillDir, "node_modules"), { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "content");
    await writeFile(join(skillDir, ".git", "config"), "git config");
    await writeFile(join(skillDir, "node_modules", "pkg.js"), "module");
    await writeFile(join(skillDir, "script.sh"), "#!/bin/bash");

    const skill = makeSkill("skip-dirs", skillDir);
    const result = await activate([skill], "skip-dirs");

    expect(result!.resources).toEqual(["script.sh"]);
  });

  it("should return all frontmatter fields", async () => {
    const skillDir = join(tmpDir, "full");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "content");

    const skill = makeSkill("full", skillDir, {
      description: "Full description.",
      license: "MIT",
      compatibility: "Node.js 20+",
      metadata: { author: "test" },
      allowedTools: ["Read", "Write"],
    });

    const result = await activate([skill], "full");

    expect(result!.description).toBe("Full description.");
    expect(result!.license).toBe("MIT");
    expect(result!.compatibility).toBe("Node.js 20+");
    expect(result!.metadata).toEqual({ author: "test" });
    expect(result!.allowedTools).toEqual(["Read", "Write"]);
  });

  it("should find correct skill among multiple", async () => {
    const dirA = join(tmpDir, "a");
    const dirB = join(tmpDir, "b");
    await mkdir(dirA, { recursive: true });
    await mkdir(dirB, { recursive: true });
    await writeFile(join(dirA, "SKILL.md"), "content");
    await writeFile(join(dirB, "SKILL.md"), "content");

    const skills = [
      makeSkill("skill-a", dirA, { description: "A" }),
      makeSkill("skill-b", dirB, { description: "B" }),
    ];

    const result = await activate(skills, "skill-b");
    expect(result!.name).toBe("skill-b");
    expect(result!.description).toBe("B");
  });

  it("should return sorted resources", async () => {
    const skillDir = join(tmpDir, "sorted");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "content");
    await writeFile(join(skillDir, "z-file.txt"), "z");
    await writeFile(join(skillDir, "a-file.txt"), "a");
    await writeFile(join(skillDir, "m-file.txt"), "m");

    const skill = makeSkill("sorted", skillDir);
    const result = await activate([skill], "sorted");

    expect(result!.resources).toEqual([
      "a-file.txt",
      "m-file.txt",
      "z-file.txt",
    ]);
  });
});
