# 0024. Frontend performance decisions deferred to production baseline

- **Status:** Accepted
- **Date:** 2026-04-14
- **Deciders:** Maksim Pokhiliy
- **Tags:** `frontend`, `performance`, `bundle`, `next.js`

## Context

The §10 frontend audit optimized what could be optimized without infrastructure changes: tree-shaking config (`optimizePackageImports`), dead dependency removal, RSC conversion for marketing, ISR, `next/image` migration, dynamic imports for heavy editor/DnD deps, and bundle analyzer setup. What remains are decisions that require either production traffic data, CI pipeline investment, or structural package changes that affect the entire monorepo.

## Decision

The following frontend performance decisions are deferred. Each has a **trigger** — a concrete signal that means "decide now, not later."

**Bundle size CI gate.** `@next/bundle-analyzer` is installed (ADR scope: measurement). No automated gate exists that fails CI when bundle size regresses past a budget. Options: `size-limit` with per-route budgets, Next.js `experimental.outputFileTracingExcludes` + custom script parsing `.next/analyze/`, or Vercel's built-in bundle analysis in deploy comments. **Trigger:** first production deployment — baseline measurements become available, and regressions become meaningful.

**Core Web Vitals / Lighthouse CI.** No CWV measurement pipeline. Target budgets: LCP < 2.5s, CLS < 0.1, INP < 200ms. Options: `@lhci/cli` in CI against preview deploys, Vercel Speed Insights (zero-config but requires production traffic), or CrUX API for field data. Lab-only measurements (Lighthouse) miss real-device variance; field data (CrUX) requires traffic volume. **Trigger:** first production deployment with real user traffic — lab metrics become validatable against field data.

**`@repo/ui` package splitting.** The package bundles three heavy dependency groups in one barrel: framer-motion (ContentSection, FullscreenSection — marketing-only), tiptap × 6 packages (RichTextEditor — admin-only), isomorphic-dompurify (RichTextViewer — admin/platform). Any app importing from `@repo/ui` risks pulling the entire dep graph if tree-shaking misses a barrel re-export. Dynamic imports (10.3.D) mitigate for tiptap and dnd-kit but don't solve the structural problem. Split candidates: `@repo/ui` (core components), `@repo/ui-editor` (tiptap), `@repo/ui-animations` (framer-motion). **Trigger:** bundle analyzer shows cross-app leakage (admin pulling framer-motion, marketing pulling tiptap), or `@repo/ui` dependency count exceeds 20.

## Consequences

- **Positive:** no speculative infrastructure. The optimization work already delivered (10.3.A–10.5.A) captures the low-hanging fruit. Measurement tooling (`@next/bundle-analyzer`) is in place for manual analysis.
- **Negative:** bundle regressions are invisible until someone manually runs `pnpm analyze:<app>`. No automated safety net.
- **Neutral:** when triggers fire, the analyzer baseline from this point forward provides the "before" measurement. The ISR + RSC work in §10 established the rendering architecture — performance gates validate it, not change it.

## References

- `docs/BIGTECH-AUDIT.md` §10 bullets: bundle budgets, Core Web Vitals, `@repo/ui` bundle sink
- ADR 0006 (MUI as design system — `optimizePackageImports` convention)
- ADR 0021 (architectural risks — `@repo/ui` splitting mentioned as 6-month risk)
