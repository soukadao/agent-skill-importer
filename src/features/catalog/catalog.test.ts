import { describe, it, expect } from "vitest";
import { catalog } from "./catalog.js";
import type { Skill } from "../../shared/types.js";

function makeSkill(name: string, description: string): Skill {
  return {
    name,
    description,
    license: null,
    compatibility: null,
    metadata: {},
    allowedTools: [],
    content: "",
    location: `/skills/${name}/SKILL.md`,
    baseDir: `/skills/${name}`,
    scope: "project",
  };
}

describe("catalog", () => {
  describe("json (default)", () => {
    it("should return name and description for each skill", () => {
      const skills = [
        makeSkill("skill-a", "Does A."),
        makeSkill("skill-b", "Does B."),
      ];
      const result = catalog(skills);
      expect(result).toEqual([
        { name: "skill-a", description: "Does A." },
        { name: "skill-b", description: "Does B." },
      ]);
    });

    it("should return empty array for no skills", () => {
      expect(catalog([])).toEqual([]);
    });

    it("should return a single entry", () => {
      const skills = [makeSkill("only", "The only skill.")];
      const result = catalog(skills);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "only",
        description: "The only skill.",
      });
    });

    it("should not include other fields", () => {
      const skill = makeSkill("test", "Test skill.");
      skill.license = "MIT";
      skill.metadata = { author: "me" };
      const result = catalog([skill]);
      expect(Object.keys(result[0]!)).toEqual(["name", "description"]);
    });

    it("should return json when format is explicitly json", () => {
      const skills = [makeSkill("a", "A.")];
      const result = catalog(skills, "json");
      expect(result).toEqual([{ name: "a", description: "A." }]);
    });
  });

  describe("xml", () => {
    it("should return xml string", () => {
      const skills = [makeSkill("pdf", "Process PDFs.")];
      const result = catalog(skills, "xml");
      expect(typeof result).toBe("string");
      expect(result).toBe(
        [
          "<available_skills>",
          "  <skill>",
          "    <name>pdf</name>",
          "    <description>Process PDFs.</description>",
          "  </skill>",
          "</available_skills>",
        ].join("\n"),
      );
    });

    it("should include multiple skills", () => {
      const skills = [
        makeSkill("skill-a", "Does A."),
        makeSkill("skill-b", "Does B."),
      ];
      const result = catalog(skills, "xml") as string;
      expect(result).toContain("<name>skill-a</name>");
      expect(result).toContain("<name>skill-b</name>");
      expect(result).toContain("<description>Does A.</description>");
      expect(result).toContain("<description>Does B.</description>");
    });

    it("should return empty available_skills for no skills", () => {
      const result = catalog([], "xml");
      expect(result).toBe("<available_skills>\n\n</available_skills>");
    });

    it("should escape special xml characters", () => {
      const skills = [makeSkill("test", 'Use when: x < 3 & y > 1 "ok"')];
      const result = catalog(skills, "xml") as string;
      expect(result).toContain(
        "<description>Use when: x &lt; 3 &amp; y &gt; 1 &quot;ok&quot;</description>",
      );
    });
  });
});
