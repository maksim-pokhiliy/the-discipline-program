# 0018. Security design decisions deferred to implementation phase

- **Status:** Accepted
- **Date:** 2026-04-12
- **Deciders:** Maksim Pokhiliy
- **Tags:** `security`, `auth`, `rate-limiting`, `csp`

## Context

A security audit identified several architectural decisions that require either infrastructure setup, business stakeholder input, or both. These are not bugs — they are design choices that the current pre-launch, single-admin, zero-traffic state does not yet force. Implementing them now would be speculative infrastructure. This ADR documents what was consciously deferred and the triggers that make each decision urgent.

## Decision

The following security-related decisions are deferred. Each has a **trigger** — a concrete signal that means "decide now, not later."

**Credentials-only authentication.** The platform uses NextAuth CredentialsProvider exclusively. No OAuth, no MFA/2FA, no magic link. This is acceptable for a coaching platform with admin-provisioned accounts. **Trigger:** first external user self-registration, or any compliance requirement (SOC2, ISO 27001) that mandates MFA.

**Session duration and token revocation.** JWT with 30-day `SESSION_MAX_AGE`, no refresh token rotation, no server-side revocation/blacklist. Logout deletes the cookie but the JWT remains valid. **Trigger:** first report of token theft, first compliance audit, or first enterprise customer with session policy requirements.

**Rate limiting strategy.** No rate limiting exists on any endpoint — auth, public contact form, or API. Options: Vercel Edge Middleware with `@upstash/ratelimit`, application-level middleware in `withErrorHandling`, or Vercel WAF rules. **Trigger:** first public traffic or first abuse attempt (contact form spam, brute-force login).

**CSP nonce strategy.** Current CSP uses `script-src 'unsafe-inline'` which weakens XSS protection. Moving to nonce-based CSP requires Next.js middleware integration to inject per-request nonces. **Trigger:** first user-generated content rendered in marketing pages, or CSP violation reports in production.

**AuthZ policy layer.** Current authorization uses ad-hoc guards (`resolveCoachId`, `verifyPlanOwnership`, `verifyAthleteBelongsToCoach`). A declarative policy layer (CASL, oso, OPA) would centralize rules. **Trigger:** second role beyond coach/athlete that needs fine-grained access, or first authorization bug caused by a missing guard call.

**PII classification and encryption-at-rest.** `AthleteProfile` contains health-adjacent data (`healthStatus`, `healthNote`, `weightKg`, `heightCm`). No field-level encryption, no access audit log, no retention policy. **Trigger:** any jurisdiction where the platform operates that classifies health data as PHI/PII (HIPAA, GDPR health data provisions), or first enterprise customer with data handling requirements.

## Consequences

- **Positive:** no speculative infrastructure. Implementation effort goes to real security fixes (timing attacks, input validation, env hardening) delivered in §3.
- **Negative:** each deferred item is a conscious risk acceptance. If a trigger fires before the decision is made, the response time is longer than if infrastructure were pre-built.
- **Neutral:** this ADR must be revisited at each launch milestone. The handoff system references it as the canonical "what security work remains" document.

## References

- ADR 0004 (NextAuth with credentials provider)
