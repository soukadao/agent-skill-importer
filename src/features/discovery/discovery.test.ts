import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { discover } from "./discovery.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "skill-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true });
});

async function createSkill(basePath: string, name: string, content: string) {
  const skillDir = join(basePath, "skills", name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content);
}

describe("discover", () => {
  it("should discover a single skill", async () => {
    await createSkill(tmpDir, "my-skill", "---\nname: my-skill\n---\n");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toHaveLength(1);
    expect(results[0]!.location).toBe(
      join(tmpDir, "skills", "my-skill", "SKILL.md"),
    );
    expect(results[0]!.baseDir).toBe(
      join(tmpDir, "skills", "my-skill"),
    );
    expect(results[0]!.scope).toBe("project");
  });

  it("should discover multiple skills", async () => {
    await createSkill(tmpDir, "skill-a", "---\nname: skill-a\n---\n");
    await createSkill(tmpDir, "skill-b", "---\nname: skill-b\n---\n");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toHaveLength(2);
  });

  it("should return empty array when skills directory does not exist", async () => {
    const results = await discover([{ path: join(tmpDir, "nonexistent"), scope: "project" }]);
    expect(results).toEqual([]);
  });

  it("should skip directories without SKILL.md", async () => {
    const skillDir = join(tmpDir, "skills", "no-skill-md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "README.md"), "# Not a skill");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toEqual([]);
  });

  it("should skip non-directory entries", async () => {
    const skillsDir = join(tmpDir, "skills");
    await mkdir(skillsDir, { recursive: true });
    await writeFile(join(skillsDir, "not-a-dir.txt"), "text");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toEqual([]);
  });

  it("should skip .git directories", async () => {
    const gitDir = join(tmpDir, "skills", ".git");
    await mkdir(gitDir, { recursive: true });
    await writeFile(join(gitDir, "SKILL.md"), "---\nname: git\n---\n");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toEqual([]);
  });

  it("should skip node_modules directories", async () => {
    const nmDir = join(tmpDir, "skills", "node_modules");
    await mkdir(nmDir, { recursive: true });
    await writeFile(join(nmDir, "SKILL.md"), "---\nname: nm\n---\n");
    const results = await discover([{ path: tmpDir, scope: "project" }]);
    expect(results).toEqual([]);
  });

  it("should discover from multiple paths", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "skill-test-"));
    try {
      await createSkill(tmpDir, "skill-a", "---\nname: skill-a\n---\n");
      await createSkill(tmpDir2, "skill-b", "---\nname: skill-b\n---\n");
      const results = await discover([{ path: tmpDir, scope: "project" }, { path: tmpDir2, scope: "user" }]);
      expect(results).toHaveLength(2);
    } finally {
      await rm(tmpDir2, { recursive: true });
    }
  });

  it("should continue when one path does not exist", async () => {
    await createSkill(tmpDir, "my-skill", "---\nname: my-skill\n---\n");
    const results = await discover([{ path: "/nonexistent/path", scope: "project" }, { path: tmpDir, scope: "user" }]);
    expect(results).toHaveLength(1);
  });

  it("should return empty array for empty paths", async () => {
    const results = await discover([]);
    expect(results).toEqual([]);
  });
});
