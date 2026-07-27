# post-uat — deferred / carry-forwards

Status: `OPEN` / `SCHEDULED` / `CLOSED` / `DROPPED`.

- **TikTok link (UAT chat 18.07).** DROPPED (owner 27.07) — accidental paste, unrelated to the project.
- **Social links for PU-10.** CLOSED (27.07) — Denys delivered the current BRAND handles (canonicalized, tracking params stripped): `https://www.youtube.com/@the_discipline_program` · `https://t.me/the_discipline_channel` · `https://www.instagram.com/the_discipline_program`. Notable: the Instagram handle moved from the git-era personal `denis_sergeev_coach` to the brand account, YouTube is NEW (never in the codebase), and the personal `t.me/denis_sergeev_coach` is NOT on the list — publish brand channels only. PU-10 unblocked.
- **Prod env verification (Resend + Telegram vars).** OPEN — folded into PU-11 acceptance (D-3). `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO` are optional in `packages/env` and silently skip when unset; nobody has confirmed they exist in Vercel prod → lead-notification emails may have never fired. Check BEFORE blaming the code.
- **Legacy iOS app rejects platform credentials.** CLOSED (by design) — separate auth domain; unification is MP-NORTH-STAR (`mobile-publish/deferred.md`). Communicate to testers; no code.
- **Live social content / team achievements on the site.** DROPPED — content production (Denys's side), not a platform feature. Revisit only if an embed/feed feature is explicitly requested.
- **Cross-initiative, NOT absorbed here (guard against double-booking):** athlete-core demo-day backlog stays in `athlete-core/deferred.md` — records benchmark-grouping (same records-view surface as PU-01 — cross-check when W1 lands), blog slugify, hide-future-weeks feature, purchase→auto-plan (couples with PU-14). Mobile-publish carry-forwards (MP-2..MP-21) stay in `mobile-publish/deferred.md`; MP-14 (`cap`→`AMRAP` athlete-facing label) is adjacent to W1's session-view surface — candidate to ride along if the owner ratifies it there.
