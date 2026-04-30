# 0026. DX and process decisions deferred to team growth

- **Status:** Accepted
- **Date:** 2026-04-14
- **Deciders:** Maksim Pokhiliy
- **Tags:** `dx`, `process`, `ci`, `onboarding`

## Context

A DX audit assessed process maturity. Several items from the original audit were already resolved in prior sections: CI pipeline, deploy config versioning, pre-commit performance (turbo filtering). The remaining items are process infrastructure that becomes valuable at team scale but is premature for a solo pre-production project.

## Decision

The following DX improvements are deferred. Each has a **trigger**.

**Docker Compose for local development.** Currently relies on external Neon DB + manual env vars. A `docker-compose.yml` with local Postgres would make onboarding a `git clone → pnpm install → pnpm dev` experience. **Trigger:** second developer onboards to the project.

**CONTRIBUTING.md.** Coding standards live in `CLAUDE.md`, architecture in `docs/BOUNDED-CONTEXTS.md`, deployment in `docs/DEPLOY.md`, decisions in `docs/adr/`. A dedicated contributor guide would consolidate the "how to work here" narrative. **Trigger:** second contributor, or first external contribution.

**CODEOWNERS.** Automated reviewer assignment via `.github/CODEOWNERS`. **Trigger:** second contributor with distinct area ownership (e.g., one person owns platform, another owns admin).

**Dependabot / Renovate.** Automated dependency update PRs. Security patches are the main value — pre-production with no public traffic reduces urgency. **Trigger:** first production deployment (security patch SLA becomes real).

**Feature flags.** LaunchDarkly / GrowthBook / OpenFeature for deploy-release separation. **Trigger:** first feature that needs gradual rollout, A/B testing, or instant kill-switch in production.

**Release pipeline.** Changesets or semantic-release for automated versioning and changelogs. **Trigger:** first production release, or first external consumer of internal packages.

**SAST/DAST/SCA.** CodeQL, Snyk, or similar for automated security scanning. **Trigger:** first production deployment, or first compliance/security audit requirement.

## Consequences

- **Positive:** no speculative process infrastructure. The implemented items (PR template, db script unification) deliver immediate ergonomic value.
- **Negative:** onboarding a second developer requires manual env setup and Neon DB access. No automated dependency security alerts.
- **Neutral:** all triggers are tied to concrete milestones (production deployment, second developer). The project can adopt each independently.

## References

- `.github/workflows/ci.yml` — CI pipeline
- `docs/DEPLOY.md` — deployment documentation
- `.github/pull_request_template.md` — PR template
