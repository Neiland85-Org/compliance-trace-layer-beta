/**
 * Local Adapter — Reads local filesystem to produce raw intake data
 *
 * For analyzing repos already on disk (cloned, uploaded, or local projects).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { RawIntakeData } from "./github-adapter.js";

const MAX_DEPTH = 4;
const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".nuxt",
  "__pycache__", ".venv", "vendor", "target", ".cache",
]);

/**
 * Scan a local directory and produce RawIntakeData.
 */
export function scanLocalRepo(rootDir: string): RawIntakeData {
  const absRoot = path.resolve(rootDir);

  if (!fs.existsSync(absRoot)) {
    throw new Error(`Directory not found: ${absRoot}`);
  }

  const fileTree = walkDir(absRoot, absRoot, 0);

  // Read package.json if exists
  let packageJson: Record<string, unknown> | null = null;
  const pkgPath = path.join(absRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch {
      // Skip if malformed
    }
  }

  const hasDockerfile = fileTree.some(
    (f) => f === "Dockerfile" || f.endsWith("/Dockerfile")
  );
  const hasCompose = fileTree.some(
    (f) => f.includes("docker-compose") || f.includes("compose.yml") || f.includes("compose.yaml")
  );

  // Detect CI
  let ciProvider: RawIntakeData["ciProvider"] = "none";
  if (fileTree.some((f) => f.startsWith(".github/workflows/"))) ciProvider = "github-actions";
  else if (fileTree.includes(".gitlab-ci.yml")) ciProvider = "gitlab-ci";
  else if (fileTree.some((f) => f.startsWith(".circleci/"))) ciProvider = "circleci";

  return {
    source: { type: "github" as const, url: `file://${absRoot}` },
    repoMeta: {
      name: path.basename(absRoot),
      description: null,
      defaultBranch: "main",
      language: detectPrimaryLanguage(fileTree),
      topics: [],
    },
    fileTree,
    packageJson,
    hasDockerfile,
    hasCompose,
    composeServices: [],
    ciProvider,
    hasWorkflows: fileTree.some((f) => f.startsWith(".github/workflows/")),
  };
}

/**
 * Compute SHA-256 hash of a file's content.
 */
export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Detect the file language from its extension.
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript", ".tsx": "typescript",
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".sql": "sql",
    ".yml": "yaml", ".yaml": "yaml",
    ".json": "json",
    ".md": "markdown",
    ".sh": "shell",
    ".dockerfile": "dockerfile",
  };
  if (filePath.toLowerCase().endsWith("dockerfile")) return "dockerfile";
  return map[ext] || "unknown";
}

// ─── Internal helpers ─────────────────────────────────────────────

function walkDir(dir: string, root: string, depth: number): string[] {
  if (depth > MAX_DEPTH) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") && depth === 0 && entry.isDirectory()) {
      // Include top-level dotdirs like .github but skip others at depth
      if (!["github", "gitlab-ci"].some((d) => entry.name === `.${d}`)) {
        // Still add the directory name for detection
        files.push(path.relative(root, path.join(dir, entry.name)));
        continue;
      }
    }

    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, root, depth + 1));
    } else {
      files.push(relPath);
    }
  }

  return files;
}

function detectPrimaryLanguage(fileTree: string[]): string | null {
  const counts: Record<string, number> = {};
  const langMap: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript",
    ".js": "JavaScript", ".jsx": "JavaScript",
    ".py": "Python", ".go": "Go", ".rs": "Rust",
    ".java": "Java",
  };

  for (const f of fileTree) {
    const ext = path.extname(f).toLowerCase();
    const lang = langMap[ext];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}
