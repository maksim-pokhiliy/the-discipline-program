# post-uat — deferred / carry-forwards

Status: `OPEN` / `SCHEDULED` / `CLOSED` / `DROPPED`.

- **TikTok link (UAT chat 18.07).** OPEN — content unknown; ask the owner what it referenced (suspected: a reference for PU-12 / session screen v2). Resolve before the W5 design pass.
- **Social links for PU-10.** OPEN — owner approved the feature (27.07); the actual current handles must come from Denys (git-recovered candidates: `t.me/the_discipline_channel`, `instagram.com/denis_sergeev_coach`, `t.me/denis_sergeev_coach`). W4 blocks on this for PU-10 only.
- **Prod env verification (Resend + Telegram vars).** OPEN — folded into PU-11 acceptance (D-3). `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO` are optional in `packages/env` and silently skip when unset; nobody has confirmed they exist in Vercel prod → lead-notification emails may have never fired. Check BEFORE blaming the code.
- **Legacy iOS app rejects platform credentials.** CLOSED (by design) — separate auth domain; unification is MP-NORTH-STAR (`mobile-publish/deferred.md`). Communicate to testers; no code.
- **Live social content / team achievements on the site.** DROPPED — content production (Denys's side), not a platform feature. Revisit only if an embed/feed feature is explicitly requested.
- **Cross-initiative, NOT absorbed here (guard against double-booking):** athlete-core demo-day backlog stays in `athlete-core/deferred.md` — records benchmark-grouping (same records-view surface as PU-01 — cross-check when W1 lands), blog slugify, hide-future-weeks feature, purchase→auto-plan (couples with PU-14). Mobile-publish carry-forwards (MP-2..MP-21) stay in `mobile-publish/deferred.md`; MP-14 (`cap`→`AMRAP` athlete-facing label) is adjacent to W1's session-view surface — candidate to ride along if the owner ratifies it there.
