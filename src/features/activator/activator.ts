import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { Skill, SkillDetail } from "../../shared/index.js";
import { SKILL_FILE, SKIP_DIRS } from "../../shared/index.js";

export async function activate(
  skills: Skill[],
  name: string,
): Promise<SkillDetail | null> {
  const skill = skills.find((s) => s.name === name);
  if (skill === undefined) return null;

  const { location: _, baseDir, ...rest } = skill;
  const resources = await scanResources(baseDir);

  return { ...rest, resources };
}

async function scanResources(baseDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(fullPath);
      } else {
        const rel = relative(baseDir, fullPath);
        if (rel !== SKILL_FILE) {
          results.push(rel);
        }
      }
    }
  }

  await walk(baseDir);
  return results.sort();
}
