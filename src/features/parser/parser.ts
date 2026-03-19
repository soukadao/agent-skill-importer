import { readFile } from "node:fs/promises";
import { parse } from "@soukadao/frontmatter-ts";
import type { Skill } from "../../shared/index.js";
import type { DiscoveredSkill } from "../../entities/skill/index.js";
import { ParseError } from "../../shared/index.js";

export function parseSkillSource(
  source: string,
  location: string,
  baseDir: string,
  scope: string,
): Skill {
  const result = parse(source);

  if (result === null) {
    throw new ParseError(`No frontmatter found in ${location}`);
  }

  const { data, content } = result;

  const name = asString(data.name);
  if (name === null) {
    throw new ParseError(`Missing required field "name" in ${location}`);
  }

  const description = asString(data.description);
  if (description === null || description.length === 0) {
    throw new ParseError(
      `Missing required field "description" in ${location}`,
    );
  }

  const license = asString(data.license);
  const compatibility = asString(data.compatibility);

  let metadata: Record<string, string> = {};
  if (
    data.metadata !== undefined &&
    data.metadata !== null &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
  ) {
    metadata = Object.fromEntries(
      Object.entries(data.metadata as Record<string, unknown>).map(
        ([k, v]) => [k, String(v)],
      ),
    );
  }

  const allowedToolsRaw = asString(data["allowed-tools"]);
  const allowedTools =
    allowedToolsRaw !== null
      ? allowedToolsRaw.split(/\s+/).filter(Boolean)
      : [];

  return {
    name,
    description,
    license,
    compatibility,
    metadata,
    allowedTools,
    content,
    location,
    baseDir,
    scope,
  };
}

export async function parseSkill(
  discovered: DiscoveredSkill,
): Promise<Skill> {
  const source = await readFile(discovered.location, "utf-8");
  return parseSkillSource(
    source,
    discovered.location,
    discovered.baseDir,
    discovered.scope,
  );
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;
  return null;
}
