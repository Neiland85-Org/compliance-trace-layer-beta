/**
 * License Envelope — Wraps a TemplatePackage with license + integrity seal
 *
 * The envelope is the unit of distribution. It contains:
 *   1. The TemplatePackage (spec + assets + presets)
 *   2. The LicenseGrant (who, what tier, when)
 *   3. An integrity seal (SHA-256 of the serialized package)
 *   4. Envelope metadata (created by, when, format version)
 *
 * The seal ensures the package hasn't been tampered with after licensing.
 * Verification: sha256(JSON.stringify(package)) === seal.contentHash
 */

import { z } from "zod";
import { sha256 } from "../packaging/integrity.js";
import type { LicenseGrant } from "./license-manager.js";
import type { TemplatePackage } from "../../contracts/proposal-delivery/v1/TemplatePackage.js";

// ─── Envelope schema ─────────────────────────────────────────────

export const EnvelopeSchema = z.object({
  envelopeVersion: z.literal("1-0-0"),
  envelopeId: z.string().uuid(),
  createdAt: z.string().datetime(),

  package: z.any(),    // TemplatePackage (validated separately)
  license: z.object({
    tier: z.enum(["free", "starter", "professional", "enterprise"]),
    grantedTo: z.string().min(1),
    grantedAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    maxServices: z.number(),
    maxTemplates: z.number(),
    features: z.array(z.string()),
  }),

  seal: z.object({
    algorithm: z.literal("sha256"),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    signedAt: z.string().datetime(),
  }),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;

// ─── Envelope creation ───────────────────────────────────────────

export function createEnvelope(
  pkg: TemplatePackage,
  grant: LicenseGrant
): Envelope {
  const serialized = JSON.stringify(pkg, null, 0); // deterministic
  const contentHash = sha256(serialized);
  const now = new Date().toISOString();

  return {
    envelopeVersion: "1-0-0",
    envelopeId: crypto.randomUUID(),
    createdAt: now,
    package: pkg,
    license: {
      tier: grant.tier,
      grantedTo: grant.grantedTo,
      grantedAt: grant.grantedAt,
      expiresAt: grant.expiresAt,
      maxServices: grant.maxServices,
      maxTemplates: grant.maxTemplates,
      features: grant.features as string[],
    },
    seal: {
      algorithm: "sha256",
      contentHash,
      signedAt: now,
    },
  };
}

// ─── Seal verification ───────────────────────────────────────────

export function verifySeal(envelope: Envelope): {
  valid: boolean;
  expected: string;
  actual: string;
} {
  const serialized = JSON.stringify(envelope.package, null, 0);
  const actual = sha256(serialized);
  return {
    valid: actual === envelope.seal.contentHash,
    expected: envelope.seal.contentHash,
    actual,
  };
}
