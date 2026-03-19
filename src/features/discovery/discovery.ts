import { readdir, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { DiscoveredSkill } from "../../entities/skill/index.js";
import type { SkillPath } from "../../shared/index.js";
import { SKILL_FILE, SKIP_DIRS } from "../../shared/index.js";

export async function discover(
  paths: SkillPath[],
): Promise<DiscoveredSkill[]> {
  const results: DiscoveredSkill[] = [];

  for (const { path: basePath, scope } of paths) {
    const skillsDir = resolve(basePath, "skills");

    let entries;
    try {
      entries = await readdir(skillsDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const baseDir = join(skillsDir, entry.name);
      const location = join(baseDir, SKILL_FILE);

      try {
        await access(location);
        results.push({ location, baseDir, scope });
      } catch {
        continue;
      }
    }
  }

  return results;
}
