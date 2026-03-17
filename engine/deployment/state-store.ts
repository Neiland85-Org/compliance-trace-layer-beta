/**
 * State Store — SQLite-backed persistent service registry
 *
 * Replaces the old services.json with atomic writes.
 * Eliminates race conditions between deploy.js, compose-runner.js and supervisor.js.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.STATE_DB_PATH || path.resolve(__dirname, "../data/state.db");

export interface ServiceRecord {
  name: string;
  containerName: string;
  image: string;
  hostPort: number;
  containerPort: number;
  url: string;
  manifestId: string | null;
  status: "running" | "stopped" | "error" | "missing";
  restartCount: number;
  createdAt: string;
  updatedAt: string;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      name            TEXT PRIMARY KEY,
      container_name  TEXT NOT NULL UNIQUE,
      image           TEXT NOT NULL,
      host_port       INTEGER NOT NULL,
      container_port  INTEGER NOT NULL,
      url             TEXT NOT NULL,
      manifest_id     TEXT,
      status          TEXT NOT NULL DEFAULT 'running',
      restart_count   INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      manifest_id TEXT,
      event_type  TEXT NOT NULL,
      payload     TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS port_allocations (
      port        INTEGER PRIMARY KEY,
      service     TEXT NOT NULL,
      allocated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// ─── Service CRUD ─────────────────────────────────────────────────

export function registerService(svc: Omit<ServiceRecord, "updatedAt">): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO services
      (name, container_name, image, host_port, container_port, url, manifest_id, status, restart_count, created_at, updated_at)
    VALUES
      (@name, @containerName, @image, @hostPort, @containerPort, @url, @manifestId, @status, @restartCount, @createdAt, datetime('now'))
  `).run({
    name: svc.name,
    containerName: svc.containerName,
    image: svc.image,
    hostPort: svc.hostPort,
    containerPort: svc.containerPort,
    url: svc.url,
    manifestId: svc.manifestId,
    status: svc.status,
    restartCount: svc.restartCount,
    createdAt: svc.createdAt,
  });
}

export function getService(name: string): ServiceRecord | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM services WHERE name = ?").get(name) as any;
  if (!row) return undefined;
  return mapRow(row);
}

export function getAllServices(): ServiceRecord[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM services ORDER BY created_at DESC").all() as any[];
  return rows.map(mapRow);
}

export function updateServiceStatus(
  name: string,
  status: ServiceRecord["status"],
  restartCount?: number
): void {
  const db = getDb();
  if (restartCount !== undefined) {
    db.prepare(
      "UPDATE services SET status = ?, restart_count = ?, updated_at = datetime('now') WHERE name = ?"
    ).run(status, restartCount, name);
  } else {
    db.prepare(
      "UPDATE services SET status = ?, updated_at = datetime('now') WHERE name = ?"
    ).run(status, name);
  }
}

export function removeService(name: string): void {
  const db = getDb();
  const svc = getService(name);
  if (svc) {
    db.prepare("DELETE FROM port_allocations WHERE service = ?").run(name);
  }
  db.prepare("DELETE FROM services WHERE name = ?").run(name);
}

// ─── Port management ──────────────────────────────────────────────

export function allocatePort(service: string, preferredPort?: number): number {
  const db = getDb();

  if (preferredPort) {
    const existing = db
      .prepare("SELECT port FROM port_allocations WHERE port = ?")
      .get(preferredPort);
    if (!existing) {
      db.prepare("INSERT INTO port_allocations (port, service) VALUES (?, ?)").run(
        preferredPort,
        service
      );
      return preferredPort;
    }
  }

  // Find next available port in range 8000-9000
  const allocated = db
    .prepare("SELECT port FROM port_allocations ORDER BY port")
    .all() as { port: number }[];
  const usedPorts = new Set(allocated.map((r) => r.port));

  for (let p = 8000; p < 9000; p++) {
    if (!usedPorts.has(p)) {
      db.prepare("INSERT INTO port_allocations (port, service) VALUES (?, ?)").run(
        p,
        service
      );
      return p;
    }
  }

  throw new Error("No available ports in range 8000-9000");
}

export function releasePort(port: number): void {
  const db = getDb();
  db.prepare("DELETE FROM port_allocations WHERE port = ?").run(port);
}

// ─── Event log ────────────────────────────────────────────────────

export function logEvent(
  eventType: string,
  payload: Record<string, unknown>,
  manifestId?: string
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO event_log (manifest_id, event_type, payload) VALUES (?, ?, ?)"
  ).run(manifestId || null, eventType, JSON.stringify(payload));
}

// ─── Helpers ──────────────────────────────────────────────────────

function mapRow(row: any): ServiceRecord {
  return {
    name: row.name,
    containerName: row.container_name,
    image: row.image,
    hostPort: row.host_port,
    containerPort: row.container_port,
    url: row.url,
    manifestId: row.manifest_id,
    status: row.status,
    restartCount: row.restart_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
