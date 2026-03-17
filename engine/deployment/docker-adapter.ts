/**
 * Docker Adapter — Safe container lifecycle management
 *
 * ALL Docker interactions go through spawn() with argument arrays.
 * NEVER uses exec() with string interpolation.
 * NEVER passes unsanitized user input to shell commands.
 */

import { spawn } from "child_process";

const NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const IMAGE_ALLOWLIST = new Set(
  (process.env.ALLOWED_IMAGES || "nginx,node:20,node:22,postgres:16,postgres:16-alpine")
    .split(",")
    .map((s) => s.trim())
);

// ─── Validation ───────────────────────────────────────────────────

function validateName(name: string): void {
  if (!NAME_REGEX.test(name)) {
    throw new Error(`Invalid container name: ${name}`);
  }
}

function validateImage(image: string): void {
  if (!IMAGE_ALLOWLIST.has(image)) {
    throw new Error(`Image not allowed: ${image}. Allowed: ${[...IMAGE_ALLOWLIST].join(", ")}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function runDocker(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("docker", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`docker ${args[0]} failed (exit ${code}): ${stderr.trim()}`));
      } else {
        resolve(stdout.trim());
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn docker: ${err.message}`));
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────

export interface RunContainerOpts {
  containerName: string;
  image: string;
  hostPort: number;
  containerPort: number;
  env?: Record<string, string>;
  restart?: "always" | "on-failure" | "no";
}

export async function runContainer(opts: RunContainerOpts): Promise<string> {
  validateName(opts.containerName);
  validateImage(opts.image);

  const args = [
    "run", "-d",
    "--name", opts.containerName,
    "-p", `${opts.hostPort}:${opts.containerPort}`,
  ];

  if (opts.restart) {
    args.push("--restart", opts.restart);
  }

  if (opts.env) {
    for (const [key, value] of Object.entries(opts.env)) {
      args.push("-e", `${key}=${value}`);
    }
  }

  args.push(opts.image);

  const containerId = await runDocker(args);
  return containerId;
}

export async function stopContainer(name: string): Promise<void> {
  validateName(name);
  await runDocker(["rm", "-f", name]);
}

export async function restartContainer(name: string): Promise<void> {
  validateName(name);
  await runDocker(["restart", name]);
}

export async function getContainerLogs(name: string, tail = 50): Promise<string> {
  validateName(name);
  return runDocker(["logs", "--tail", String(tail), name]);
}

export async function isContainerRunning(name: string): Promise<boolean> {
  validateName(name);
  try {
    const result = await runDocker(["inspect", "-f", "{{.State.Running}}", name]);
    return result === "true";
  } catch {
    return false;
  }
}

export async function listRunningContainers(): Promise<string[]> {
  try {
    const output = await runDocker(["ps", "--format", "{{.Names}}"]);
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export { IMAGE_ALLOWLIST };
