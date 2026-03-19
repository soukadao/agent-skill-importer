import { describe, it, expect } from "vitest";
import { parseSkillSource } from "./parser.js";
import { ParseError } from "../../shared/errors.js";

const loc = "/test/skills/my-skill/SKILL.md";
const dir = "/test/skills/my-skill";

describe("parseSkillSource", () => {
  it("should parse minimal skill", () => {
    const source = `---
name: my-skill
description: A test skill.
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.name).toBe("my-skill");
    expect(skill.description).toBe("A test skill.");
    expect(skill.license).toBeNull();
    expect(skill.compatibility).toBeNull();
    expect(skill.metadata).toEqual({});
    expect(skill.allowedTools).toEqual([]);
    expect(skill.content).toBe("");
    expect(skill.location).toBe(loc);
    expect(skill.baseDir).toBe(dir);
  });

  it("should parse skill with all optional fields", () => {
    const source = `---
name: pdf-processing
description: Extract PDF text, fill forms, merge files.
license: Apache-2.0
compatibility: Requires poppler-utils
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(git:*) Read Write
---

# PDF Processing

Use this skill when working with PDFs.
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.name).toBe("pdf-processing");
    expect(skill.description).toBe(
      "Extract PDF text, fill forms, merge files.",
    );
    expect(skill.license).toBe("Apache-2.0");
    expect(skill.compatibility).toBe("Requires poppler-utils");
    expect(skill.metadata).toEqual({ author: "example-org", version: "1.0" });
    expect(skill.allowedTools).toEqual(["Bash(git:*)", "Read", "Write"]);
    expect(skill.content).toContain("# PDF Processing");
  });

  it("should parse skill with body content", () => {
    const source = `---
name: code-review
description: Reviews code for quality.
---

## Steps

1. Read the file
2. Analyze patterns
3. Report findings
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.content).toContain("## Steps");
    expect(skill.content).toContain("1. Read the file");
  });

  it("should throw ParseError when no frontmatter", () => {
    const source = "# Just a markdown file\n\nNo frontmatter here.";
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(ParseError);
  });

  it("should throw ParseError when name is missing", () => {
    const source = `---
description: A skill without a name.
---
`;
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(ParseError);
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(
      /Missing required field "name"/,
    );
  });

  it("should throw ParseError when description is missing", () => {
    const source = `---
name: no-desc
---
`;
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(ParseError);
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(
      /Missing required field "description"/,
    );
  });

  it("should throw ParseError when description is empty", () => {
    const source = `---
name: empty-desc
description: ""
---
`;
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(ParseError);
    expect(() => parseSkillSource(source, loc, dir, "project")).toThrow(
      /Missing required field "description"/,
    );
  });

  it("should convert non-string metadata values to strings", () => {
    const source = `---
name: meta-test
description: Test metadata conversion.
metadata:
  count: 42
  enabled: true
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.metadata).toEqual({ count: "42", enabled: "true" });
  });

  it("should ignore metadata if not an object", () => {
    const source = `---
name: meta-test
description: Test metadata as string.
metadata: not-an-object
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.metadata).toEqual({});
  });

  it("should ignore metadata if it is an array", () => {
    const source = `---
name: meta-test
description: Test metadata as array.
metadata:
  - item1
  - item2
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.metadata).toEqual({});
  });

  it("should handle allowed-tools with extra whitespace", () => {
    const source = `---
name: tools-test
description: Test allowed-tools parsing.
allowed-tools: "Read   Write   Bash(git:*)"
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.allowedTools).toEqual(["Read", "Write", "Bash(git:*)"]);
  });

  it("should return empty allowedTools when field is absent", () => {
    const source = `---
name: no-tools
description: No tools specified.
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.allowedTools).toEqual([]);
  });

  it("should handle license field", () => {
    const source = `---
name: licensed
description: A licensed skill.
license: "Proprietary. LICENSE.txt has complete terms"
---
`;
    const skill = parseSkillSource(source, loc, dir, "project");
    expect(skill.license).toBe(
      "Proprietary. LICENSE.txt has complete terms",
    );
  });
});
