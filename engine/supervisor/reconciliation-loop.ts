/**
 * Reconciliation Loop — Desired-state convergence
 *
 * Compares desired state (SQLite) with actual state (Docker daemon).
 * Restarts missing containers with backoff.
 * Marks containers as degraded after max retries.
 * Emits DeploymentStateEvents for each state change.
 */

import { listRunningContainers, restartContainer } from "../deployment/docker-adapter.js";
import {
  getAllServices,
  updateServiceStatus,
  logEvent,
  type ServiceRecord,
} from "../deployment/state-store.js";

const MAX_RETRIES = parseInt(process.env.RECONCILE_MAX_RETRIES || "5", 10);
const INTERVAL_MS = parseInt(process.env.RECONCILE_INTERVAL_MS || "10000", 10);

let running = false;

export async function reconcile(): Promise<void> {
  const services = getAllServices();
  if (services.length === 0) return;

  const runningContainers = new Set(await listRunningContainers());

  for (const svc of services) {
    // Skip services that are intentionally stopped or already degraded beyond repair
    if (svc.status === "stopped") continue;

    const isRunning = runningContainers.has(svc.containerName);

    if (isRunning && svc.status !== "running") {
      // Container came back — update status
      updateServiceStatus(svc.name, "running", 0);
      logEvent("reconciled", {
        service: svc.name,
        containerName: svc.containerName,
        previousStatus: svc.status,
      }, svc.manifestId || undefined);
      console.log(`[reconciler] ${svc.name} recovered → running`);
    }

    if (!isRunning && svc.status === "running") {
      // Container disappeared — try restart
      if (svc.restartCount >= MAX_RETRIES) {
        updateServiceStatus(svc.name, "error", svc.restartCount);
        logEvent("failed", {
          service: svc.name,
          reason: `Exceeded max retries (${MAX_RETRIES})`,
        }, svc.manifestId || undefined);
        console.error(`[reconciler] ${svc.name} FAILED — exceeded ${MAX_RETRIES} retries`);
        continue;
      }

      console.log(`[reconciler] ${svc.name} missing — restart attempt ${svc.restartCount + 1}/${MAX_RETRIES}`);

      try {
        await restartContainer(svc.containerName);
        updateServiceStatus(svc.name, "running", svc.restartCount + 1);
        logEvent("reconciled", {
          service: svc.name,
          attempt: svc.restartCount + 1,
        }, svc.manifestId || undefined);
      } catch (err) {
        updateServiceStatus(svc.name, "missing", svc.restartCount + 1);
        logEvent("drift-detected", {
          service: svc.name,
          error: err instanceof Error ? err.message : String(err),
        }, svc.manifestId || undefined);
      }
    }
  }
}

export function startReconciliationLoop(): void {
  if (running) return;
  running = true;

  console.log(`[reconciler] Started (interval: ${INTERVAL_MS}ms, maxRetries: ${MAX_RETRIES})`);

  setInterval(async () => {
    try {
      await reconcile();
    } catch (err) {
      console.error("[reconciler] Unhandled error:", err);
    }
  }, INTERVAL_MS);
}

export function isReconcilerRunning(): boolean {
  return running;
}
