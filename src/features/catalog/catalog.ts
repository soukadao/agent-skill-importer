import type {
  Skill,
  SkillCatalogEntry,
  CatalogFormat,
} from "../../shared/index.js";

export function catalog(skills: Skill[]): SkillCatalogEntry[];
export function catalog(skills: Skill[], format: "json"): SkillCatalogEntry[];
export function catalog(skills: Skill[], format: "xml"): string;
export function catalog(
  skills: Skill[],
  format?: CatalogFormat,
): SkillCatalogEntry[] | string {
  const entries = skills.map((s) => ({
    name: s.name,
    description: s.description,
    location: s.location,
  }));

  if (format === "xml") {
    return toXml(entries);
  }

  return entries;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toXml(entries: SkillCatalogEntry[]): string {
  const lines = entries.map(
    (e) =>
      `  <skill>\n    <name>${escapeXml(e.name)}</name>\n    <description>${escapeXml(e.description)}</description>\n    <location>${escapeXml(e.location)}</location>\n  </skill>`,
  );
  return `<available_skills>\n${lines.join("\n")}\n</available_skills>`;
}
