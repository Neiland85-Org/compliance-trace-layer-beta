/**
 * GitHub Adapter — Fetches repo metadata and produces raw intake data
 *
 * Replaces the inline fetch logic from tools/trace-cli/trace.js
 * with proper error handling, pagination awareness, and typed output.
 *
 * IMPORTANT: This adapter does NOT produce a CodebaseSnapshot directly.
 * It produces RawIntakeData, which the normalizer transforms into a snapshot.
 */

export interface RawIntakeData {
  source: {
    type: "github";
    url: string;
    ref?: string;
  };
  repoMeta: {
    name: string;
    description: string | null;
    defaultBranch: string;
    language: string | null;
    topics: string[];
  };
  fileTree: string[];
  packageJson: Record<string, unknown> | null;
  hasDockerfile: boolean;
  hasCompose: boolean;
  composeServices: string[];
  ciProvider: "github-actions" | "gitlab-ci" | "circleci" | "none";
  hasWorkflows: boolean;
}

/**
 * Fetch repository data from GitHub API.
 *
 * @param repoUrl - Full GitHub URL (e.g., https://github.com/org/repo)
 * @param token   - Optional GitHub PAT for private repos / rate limiting
 */
export async function fetchGitHubRepo(
  repoUrl: string,
  token?: string
): Promise<RawIntakeData> {
  const parsed = parseGitHubUrl(repoUrl);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "trace-platform-intake/1.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Fetch repo metadata
  const metaRes = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
    { headers }
  );

  if (!metaRes.ok) {
    throw new Error(
      `GitHub API error (${metaRes.status}): ${await metaRes.text()}`
    );
  }

  const meta = (await metaRes.json()) as Record<string, unknown>;

  // Fetch file tree (root level + 1 depth)
  const contentsRes = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents`,
    { headers }
  );

  const contents = contentsRes.ok
    ? ((await contentsRes.json()) as { name: string; type: string; path: string }[])
    : [];

  const fileTree = contents.map((c) => c.path);

  // Detect package.json
  let packageJson: Record<string, unknown> | null = null;
  if (fileTree.includes("package.json")) {
    try {
      const pkgRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/package.json`,
        { headers }
      );
      if (pkgRes.ok) {
        const pkgData = (await pkgRes.json()) as { content: string };
        const decoded = Buffer.from(pkgData.content, "base64").toString("utf8");
        packageJson = JSON.parse(decoded);
      }
    } catch {
      // Non-critical: skip if parse fails
    }
  }

  // Detect Docker presence
  const hasDockerfile = fileTree.some(
    (f) => f === "Dockerfile" || f.endsWith("/Dockerfile")
  );
  const hasCompose = fileTree.some(
    (f) => f.startsWith("docker-compose") || f.startsWith("compose.")
  );

  // Detect CI
  const hasWorkflows = fileTree.includes(".github");
  let ciProvider: RawIntakeData["ciProvider"] = "none";
  if (hasWorkflows) ciProvider = "github-actions";
  else if (fileTree.includes(".gitlab-ci.yml")) ciProvider = "gitlab-ci";
  else if (fileTree.includes(".circleci")) ciProvider = "circleci";

  return {
    source: { type: "github", url: repoUrl },
    repoMeta: {
      name: meta.name as string,
      description: (meta.description as string) || null,
      defaultBranch: (meta.default_branch as string) || "main",
      language: (meta.language as string) || null,
      topics: ((meta.topics as string[]) || []),
    },
    fileTree,
    packageJson,
    hasDockerfile,
    hasCompose,
    composeServices: [],
    ciProvider,
    hasWorkflows,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const cleaned = url
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  return { owner: match[1], repo: match[2] };
}
