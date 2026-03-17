/**
 * License Manager — Tier enforcement and license lifecycle
 *
 * License tiers:
 *   free         → No restrictions, community templates only
 *   starter      → Basic templates, no SLA, limited customization
 *   professional → Full templates, parameter overrides, presets
 *   enterprise   → All features, custom branding, priority support, SLA
 *
 * Restrictions are enforced at packaging time, NOT at runtime.
 * The engine deploys whatever it receives — license is a gate before delivery.
 */

import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────

export type LicenseTier = "free" | "starter" | "professional" | "enterprise";

export interface LicenseGrant {
  tier: LicenseTier;
  grantedTo: string;           // Email or org identifier
  grantedAt: string;           // ISO 8601
  expiresAt: string | null;    // null = perpetual
  maxServices: number;         // Max services per template
  maxTemplates: number;        // Max templates licensee can use
  features: LicenseFeature[];
}

export type LicenseFeature =
  | "custom-presets"
  | "parameter-overrides"
  | "priority-support"
  | "custom-branding"
  | "sla-guarantee"
  | "source-access"
  | "self-hosted-registry";

// ─── Tier definitions ────────────────────────────────────────────

const TIER_DEFINITIONS: Record<LicenseTier, {
  maxServices: number;
  maxTemplates: number;
  features: LicenseFeature[];
  restrictions: string[];
}> = {
  free: {
    maxServices: 3,
    maxTemplates: 2,
    features: [],
    restrictions: [
      "community-templates-only",
      "no-commercial-use",
      "no-custom-presets",
      "attribution-required",
    ],
  },
  starter: {
    maxServices: 5,
    maxTemplates: 5,
    features: ["custom-presets"],
    restrictions: [
      "no-sla",
      "community-support-only",
      "no-custom-branding",
    ],
  },
  professional: {
    maxServices: 20,
    maxTemplates: 50,
    features: [
      "custom-presets",
      "parameter-overrides",
      "source-access",
    ],
    restrictions: [
      "no-custom-branding",
      "standard-sla",
    ],
  },
  enterprise: {
    maxServices: Infinity,
    maxTemplates: Infinity,
    features: [
      "custom-presets",
      "parameter-overrides",
      "priority-support",
      "custom-branding",
      "sla-guarantee",
      "source-access",
      "self-hosted-registry",
    ],
    restrictions: [],
  },
};

// ─── Grant creation ──────────────────────────────────────────────

export function createLicenseGrant(
  tier: LicenseTier,
  grantedTo: string,
  durationDays?: number
): LicenseGrant {
  const def = TIER_DEFINITIONS[tier];
  const now = new Date();

  let expiresAt: string | null = null;
  if (durationDays) {
    const exp = new Date(now);
    exp.setDate(exp.getDate() + durationDays);
    expiresAt = exp.toISOString();
  }

  return {
    tier,
    grantedTo,
    grantedAt: now.toISOString(),
    expiresAt,
    maxServices: def.maxServices,
    maxTemplates: def.maxTemplates,
    features: [...def.features],
  };
}

// ─── Validation ──────────────────────────────────────────────────

export function isLicenseExpired(grant: LicenseGrant): boolean {
  if (!grant.expiresAt) return false;
  return new Date(grant.expiresAt) < new Date();
}

export function getRestrictions(tier: LicenseTier): string[] {
  return [...TIER_DEFINITIONS[tier].restrictions];
}

export function hasFeature(grant: LicenseGrant, feature: LicenseFeature): boolean {
  return grant.features.includes(feature);
}

// ─── Enforcement ─────────────────────────────────────────────────

export interface LicenseViolation {
  rule: string;
  detail: string;
  severity: "warning" | "blocking";
}

/**
 * Check if a template package respects the license constraints.
 * Returns violations (empty = compliant).
 */
export function enforceLicense(
  grant: LicenseGrant,
  serviceCount: number,
  templateCount: number,
  requestedFeatures: LicenseFeature[] = []
): LicenseViolation[] {
  const violations: LicenseViolation[] = [];

  if (isLicenseExpired(grant)) {
    violations.push({
      rule: "license-expired",
      detail: `License expired at ${grant.expiresAt}`,
      severity: "blocking",
    });
  }

  if (serviceCount > grant.maxServices) {
    violations.push({
      rule: "max-services-exceeded",
      detail: `Template has ${serviceCount} services, license allows ${grant.maxServices}`,
      severity: "blocking",
    });
  }

  if (templateCount > grant.maxTemplates) {
    violations.push({
      rule: "max-templates-exceeded",
      detail: `Using ${templateCount} templates, license allows ${grant.maxTemplates}`,
      severity: "blocking",
    });
  }

  for (const feat of requestedFeatures) {
    if (!hasFeature(grant, feat)) {
      violations.push({
        rule: "feature-not-available",
        detail: `Feature "${feat}" requires a higher tier (current: ${grant.tier})`,
        severity: feat === "custom-branding" ? "warning" : "blocking",
      });
    }
  }

  return violations;
}
