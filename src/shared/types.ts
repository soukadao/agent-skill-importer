export interface SkillPath {
  path: string;
  scope: string;
}

export interface Skill {
  name: string;
  description: string;
  license: string | null;
  compatibility: string | null;
  metadata: Record<string, string>;
  allowedTools: string[];
  content: string;
  location: string;
  baseDir: string;
  scope: string;
}

export type SkillCatalogEntry = Pick<Skill, "name" | "description">;

export type CatalogFormat = "json" | "xml";

export type SkillDetail = Omit<Skill, "location" | "baseDir"> & {
  resources: string[];
};

export interface SkillCollision {
  name: string;
  kept: { location: string; scope: string };
  shadowed: { location: string; scope: string };
}

export interface LoadResult {
  skills: Skill[];
  collisions: SkillCollision[];
}
