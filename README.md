# @soukadao/agent-skill-importer

[Agent Skills](https://agentskills.io/specification) を読み込むライブラリ。

## Install

```bash
npm install @soukadao/agent-skill-importer
```

## Usage

### Load skills

`loadSkills` にスコープ付きパスの配列を渡すと、各 `<path>/skills/` 配下を走査し、`SKILL.md` を解析して結果を返します。

先に読み込まれたスキルが優先されます（先勝ち）。同名スキルはプロジェクトレベルが優先されるべきなので、プロジェクトのパスをユーザーより前に配置してください。

```typescript
import { loadSkills } from "@soukadao/agent-skill-importer";

const { skills, collisions } = await loadSkills([
  { path: "/path/to/project", scope: "project" },
  { path: "/home/user", scope: "user" },
]);
```

同名スキルが複数スコープに存在する場合、先に読み込まれたものが採用され、衝突情報が `collisions` に記録されます。

```typescript
for (const c of collisions) {
  console.warn(
    `Skill "${c.name}" (${c.kept.scope}) shadowed (${c.shadowed.scope})`,
  );
}
```

### Catalog

読み込んだスキルの `name`、`description`、`location` を返します。`format` 引数で出力形式を切り替えられます（デフォルト: `"json"`）。

```typescript
import { loadSkills, catalog } from "@soukadao/agent-skill-importer";

const { skills } = await loadSkills([
  { path: "/path/to/project", scope: "project" },
]);

// JSON (default)
const entries = catalog(skills);
// [{ name: "pdf-processing", description: "Extract PDF text...", location: "/path/to/project/skills/pdf-processing/SKILL.md" }, ...]

// XML
const xml = catalog(skills, "xml");
// <available_skills>
//   <skill>
//     <name>pdf-processing</name>
//     <description>Extract PDF text...</description>
//     <location>/path/to/project/skills/pdf-processing/SKILL.md</location>
//   </skill>
// </available_skills>
```

### Activate

スキル名を指定して、SKILL.md の内容とリソースファイル一覧を取得します。

```typescript
import { loadSkills, activate } from "@soukadao/agent-skill-importer";

const { skills } = await loadSkills([
  { path: "/path/to/project", scope: "project" },
]);
const detail = await activate(skills, "pdf-processing");
// {
//   name: "pdf-processing",
//   description: "Extract PDF text, fill forms, merge files.",
//   license: "Apache-2.0",
//   compatibility: "Requires poppler-utils",
//   metadata: { author: "example-org", version: "1.0" },
//   allowedTools: ["Bash(git:*)", "Read", "Write"],
//   scope: "project",
//   content: "# PDF Processing\n...",
//   resources: ["scripts/extract.py", "references/guide.md"]
// }
```

`resources` にはスキルディレクトリ内の全ファイル（`SKILL.md` を除く）が相対パスで含まれます。

## Types

```typescript
interface SkillPath {
  path: string;
  scope: string;
}

interface Skill {
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

type SkillCatalogEntry = Pick<Skill, "name" | "description" | "location">;

type SkillDetail = Omit<Skill, "location" | "baseDir"> & {
  resources: string[];
};

type CatalogFormat = "json" | "xml";

interface SkillCollision {
  name: string;
  kept: { location: string; scope: string };
  shadowed: { location: string; scope: string };
}

interface LoadResult {
  skills: Skill[];
  collisions: SkillCollision[];
}
```

## Expected directory structure

```
<path>/skills/
├── pdf-processing/
│   ├── SKILL.md
│   ├── scripts/
│   │   └── extract.py
│   └── references/
│       └── guide.md
└── code-review/
    └── SKILL.md
```

## License

MIT
