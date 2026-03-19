import type { SkillPath, Skill, SkillCollision, LoadResult } from "./shared/index.js";
import { discover } from "./features/discovery/index.js";
import { parseSkill } from "./features/parser/index.js";

export type {
  SkillPath,
  Skill,
  SkillCatalogEntry,
  SkillDetail,
  CatalogFormat,
  SkillCollision,
  LoadResult,
} from "./shared/index.js";
export { SkillError, ParseError } from "./shared/index.js";
export { catalog } from "./features/catalog/index.js";
export { activate } from "./features/activator/index.js";

export async function loadSkills(paths: SkillPath[]): Promise<LoadResult> {
  const discovered = await discover(paths);
  const skills: Skill[] = [];
  const seen = new Map<string, Skill>();
  const collisions: SkillCollision[] = [];

  for (const entry of discovered) {
    try {
      const skill = await parseSkill(entry);
      const existing = seen.get(skill.name);

      if (existing !== undefined) {
        collisions.push({
          name: skill.name,
          kept: { location: existing.location, scope: existing.scope },
          shadowed: { location: skill.location, scope: skill.scope },
        });
        continue;
      }

      seen.set(skill.name, skill);
      skills.push(skill);
    } catch {
      continue;
    }
  }

  return { skills, collisions };
}
