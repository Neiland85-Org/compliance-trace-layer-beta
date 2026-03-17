/**
 * Stack Detector — Identifies runtime, frameworks, databases, messaging, infra
 *
 * Replaces the basic `inferStack()` from trace.js with deep dependency-aware detection.
 * Uses package.json dependencies as primary signal, file tree as secondary.
 */

import type { CodebaseSnapshot } from "../../contracts/intake-analysis/v1/index.js";

export interface StackFingerprint {
  runtime: ("node" | "python" | "go" | "java" | "rust" | "dotnet")[];
  frameworks: string[];
  databases: string[];
  messaging: string[];
  containerization: "docker" | "podman" | "none";
  orchestration: "compose" | "kubernetes" | "none";
}

// ─── Detection rules ──────────────────────────────────────────────

const FRAMEWORK_RULES: { dep: string; name: string }[] = [
  { dep: "express", name: "express" },
  { dep: "fastify", name: "fastify" },
  { dep: "koa", name: "koa" },
  { dep: "hapi", name: "hapi" },
  { dep: "nest", name: "nestjs" },
  { dep: "@nestjs/core", name: "nestjs" },
  { dep: "next", name: "next" },
  { dep: "nuxt", name: "nuxt" },
  { dep: "react", name: "react" },
  { dep: "react-dom", name: "react" },
  { dep: "vue", name: "vue" },
  { dep: "svelte", name: "svelte" },
  { dep: "@angular/core", name: "angular" },
  { dep: "gatsby", name: "gatsby" },
  { dep: "remix", name: "remix" },
  { dep: "astro", name: "astro" },
  { dep: "electron", name: "electron" },
  { dep: "framer-motion", name: "framer-motion" },
  { dep: "three", name: "three.js" },
  { dep: "@react-three/fiber", name: "react-three-fiber" },
  { dep: "tailwindcss", name: "tailwind" },
  { dep: "zustand", name: "zustand" },
  { dep: "redux", name: "redux" },
  { dep: "@reduxjs/toolkit", name: "redux-toolkit" },
  { dep: "prisma", name: "prisma" },
  { dep: "@prisma/client", name: "prisma" },
  { dep: "drizzle-orm", name: "drizzle" },
  { dep: "typeorm", name: "typeorm" },
  { dep: "sequelize", name: "sequelize" },
  { dep: "knex", name: "knex" },
  { dep: "mongoose", name: "mongoose" },
  { dep: "zod", name: "zod" },
  { dep: "joi", name: "joi" },
];

const DATABASE_RULES: { dep: string; name: string }[] = [
  { dep: "pg", name: "postgres" },
  { dep: "postgres", name: "postgres" },
  { dep: "@prisma/client", name: "postgres" },  // Most common Prisma target
  { dep: "mysql2", name: "mysql" },
  { dep: "better-sqlite3", name: "sqlite" },
  { dep: "mongodb", name: "mongodb" },
  { dep: "mongoose", name: "mongodb" },
  { dep: "redis", name: "redis" },
  { dep: "ioredis", name: "redis" },
  { dep: "@upstash/redis", name: "redis" },
];

const MESSAGING_RULES: { dep: string; name: string }[] = [
  { dep: "nats", name: "nats" },
  { dep: "amqplib", name: "rabbitmq" },
  { dep: "kafkajs", name: "kafka" },
  { dep: "bullmq", name: "bullmq" },
  { dep: "bee-queue", name: "bee-queue" },
  { dep: "@google-cloud/pubsub", name: "gcp-pubsub" },
  { dep: "@aws-sdk/client-sqs", name: "aws-sqs" },
  { dep: "@aws-sdk/client-sns", name: "aws-sns" },
];

// ─── Detector ─────────────────────────────────────────────────────

export function detectStack(snapshot: CodebaseSnapshot): StackFingerprint {
  const allDeps = {
    ...snapshot.packageJson.dependencies,
    ...snapshot.packageJson.devDependencies,
  };

  const depNames = new Set(Object.keys(allDeps));

  // Runtime detection
  const runtime: StackFingerprint["runtime"] = [];
  if (snapshot.packageJson.name || depNames.size > 0) runtime.push("node");
  if (snapshot.fileTree.some((f) => f === "requirements.txt" || f === "pyproject.toml")) runtime.push("python");
  if (snapshot.fileTree.some((f) => f === "go.mod")) runtime.push("go");
  if (snapshot.fileTree.some((f) => f === "Cargo.toml")) runtime.push("rust");
  if (snapshot.fileTree.some((f) => f === "pom.xml" || f === "build.gradle")) runtime.push("java");
  if (snapshot.fileTree.some((f) => f.endsWith(".csproj") || f.endsWith(".sln"))) runtime.push("dotnet");

  // Framework detection
  const frameworks = new Set<string>();
  for (const rule of FRAMEWORK_RULES) {
    if (depNames.has(rule.dep)) frameworks.add(rule.name);
  }

  // Database detection
  const databases = new Set<string>();
  for (const rule of DATABASE_RULES) {
    if (depNames.has(rule.dep)) databases.add(rule.name);
  }
  // File-based detection
  if (snapshot.fileTree.some((f) => f.includes("migration") && f.endsWith(".sql"))) {
    if (databases.size === 0) databases.add("postgres"); // Assume postgres for SQL migrations
  }

  // Messaging detection
  const messaging = new Set<string>();
  for (const rule of MESSAGING_RULES) {
    if (depNames.has(rule.dep)) messaging.add(rule.name);
  }

  // Containerization
  let containerization: StackFingerprint["containerization"] = "none";
  if (snapshot.dockerPresence.hasDockerfile) containerization = "docker";

  // Orchestration
  let orchestration: StackFingerprint["orchestration"] = "none";
  if (snapshot.dockerPresence.hasCompose) orchestration = "compose";
  if (snapshot.fileTree.some((f) => f.includes("k8s") || f.includes("kubernetes") || f.endsWith(".helm"))) {
    orchestration = "kubernetes";
  }

  return {
    runtime,
    frameworks: [...frameworks],
    databases: [...databases],
    messaging: [...messaging],
    containerization,
    orchestration,
  };
}
