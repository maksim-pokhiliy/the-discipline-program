# Demo rehearsal script — full product flow

Dry-run of Denys's demo. Walk it top to bottom, report any bug, fix live. Every label below is verbatim from code.

## Prod URLs

- **platform** (coach + athlete): https://the-discipline-program-platform.vercel.app
- **admin** (CMS / library): https://the-discipline-program-admin.vercel.app
- **marketing** (public): https://the-discipline-program.vercel.app

## Head coach login

- email `head-coach@thedisciplineprogram.com` · pass `TDPhead2026!change`
- Works on BOTH platform and admin (shared User, separate sessions → log in to each).

## SETUP (do before Phase 1)

1. **Two browsers** (or normal + incognito). The platform proxy is a hard role cage — coach and athlete cannot share a session. **Browser A = coach**, **Browser B = athlete**.
2. **Self-email for the invite.** `EMAIL_FROM = onboarding@resend.dev` is Resend sandbox → it only delivers to your Resend-account owner address. Invite the athlete using **an inbox you own**.
3. **Redeploy applied.** The new RESEND/EMAIL env only takes effect after the redeploy you triggered — confirm all 3 apps are READY before starting, else the invite 500s.
4. **DB clean + head coach present** (reset just before the run).

---

## Phase 1 — Coach lands (Browser A)

- Go to platform `/login` → sign in as head coach → lands on **`/coach`**.
- **Expect:** empty-state **"No athletes yet."** + a 3-step checklist + buttons **"Draft a plan"** / **"Invite athletes"**. (The rich metrics dashboard only appears once an athlete is assigned + active — that's Phase 10.)
- 🐞 Watch: redirect loop back to `/login` ⇒ `NEXTAUTH_SECRET` mismatch on the new build.

## Phase 2 — Invite the athlete (Browser A)

- `/coach/athletes` → top-right **"Invite athlete"** → dialog: **"Email"** (your self-inbox) + **"Name (optional)"** → **"Send invite"**.
- **Expect:** success toast; athlete shows in the roster **"invited"** segment; email arrives within ~1 min.
- 🐞 Watch:
  - Green toast even if the email silently failed (errors are swallowed + logged). **Confirm the email actually arrived.** If not → check the platform project's RESEND env + runtime logs.
  - Inviting any address other than your Resend owner email → no delivery (sandbox).

## Phase 3 — Athlete claims invite (Browser B)

- Open the emailed link → `/invite/[token]` → **"Welcome, {name/email}"**, **"Set your password to activate your account."**
- Set password (**"At least 12 characters"**) twice → **"Set password and continue"**.
- **Expect:** auto sign-in → toast **"Welcome to The Discipline Program"** → lands on **`/athlete`** showing **"No active plans"** (no plan yet — correct).
- 🐞 Watch:
  - Reused/expired link → generic **"Invite no longer valid"** (all reasons collapse to one screen). Mint a fresh invite each rehearsal run.
  - Cold function: auto-login may time out (10s) → fallback **"Password set. Please sign in"** → `/login`. Just log in manually — not a bug.

## Phase 4 — Build a plan (Browser A)

- `/coach/plans` → **"Create Plan"** → **"New Training Plan"**: **"Plan name"** (+ optional desc) → **"Create"** → auto-opens `/coach/plans/{id}` (status **DRAFT**).
- Author one session (each add-button is INSIDE the expanded parent — expand as you go):
  1. On a weekday row → **"+ Add session"** (creates instantly).
  2. Expand session → **"+ Add block"**.
  3. Expand block → **"+ Add schema"** → modal **"Add schema"** (everything optional) → submit **"Add schema"**.
  4. Expand schema → **"+ Add row"** → modal **"Add row"** → in the **Exercise** picker (_"search by name or create a movement…"_) type e.g. `Back Squat` → **"Create exercise"** → set reps/load if you like → **"Add row"**.
- For a richer athlete demo, add a **second row** and optionally a benchmark schema (so the athlete can log a benchmark result in Phase 8). 1RM can also be logged straight from Records (Phase 9), so a benchmark is optional.
- **Expect:** the exercise line appears under the schema.
- 🐞 Watch: fresh DB = empty exercise library → you MUST use the inline "Create exercise" detour. Empty session (no rows) later renders a workout with no exercises.

## Phase 5 — Activate the plan (Browser A) ⚠️ REQUIRED before enroll

- In the plan header, flip the **status chip** DRAFT → **ACTIVE**.
- 🐞 If you skip this: the enroll button stays disabled (**"Activate the plan to enroll athletes"**) and the backend rejects it (**"Plan must be ACTIVE to enroll athletes"**).

## Phase 6 — Enroll the athlete (Browser A)

- On the plan detail, the **"Enrolled"** strip → **"Manage enrollments"** → **"Enroll athletes"**.
- **"Search athletes"** → tick your athlete → **"Boarding date"** (defaults today) → **"Enroll 1 athlete"**.
- **Expect:** toast **"Enrolled 1 athlete"**; athlete appears in the Enrolled strip.
- 🐞 Watch: if the athlete **didn't finish Phase 3**, they're hidden from the picker → you'll see **"Every athlete is already enrolled."** (misleading). The athlete must have set a password first.

## Phase 7 — Athlete sees the plan (Browser B)

- Refresh `/athlete`.
- **Expect:** timetable with the current week (Mon–Sun), the session card on its day, **"{done} of {total} done"**. Tap the session card → `/athlete/session/{id}`.
- 🐞 Watch: still **"No active plans"** ⇒ enrollment not ACTIVE, or plan has no sessions on visible dates. "Today" uses the athlete's timezone (default UTC) — the card may sit a row off vs your local day.

## Phase 8 — Athlete logs work (Browser B)

There is **no per-exercise logging** — three distinct write moments:

- **(a) Complete the session:** **"Mark Completed"** (desktop right rail; mobile bottom bar → **"Log this session"**) + optional **"Note (optional)"** → toast **"Session logged"**.
- **(b) Benchmark result** (only if the schema is a benchmark): **"Log your result"** → fields by type → **"Save result"**. (A load-type benchmark also writes a 1RM → shows in Records.)
- **(c) Set a 1RM:** if a row's load is "% of 1RM" → **"Set 1RM"** prompt → value → **"Set"**.
- 🐞 Watch:
  - **Don't double-tap "Mark Completed"** (Re-open → complete again inserts a 2nd record; no uniqueness guard).
  - Use **integer** loads/results — >2 decimals fail with a generic "Failed to save" toast.

## Phase 9 — Athlete Records + Profile (Browser B)

- **Records** (bottom nav **"Records"** → `/athlete/records`): tabs **"1RM"** / **"Benchmarks"**. If you logged nothing here yet, hit **"Update 1RM"** → Movement / Value (kg) / Date → **"Save Record"**.
  - **Expect:** the 1RM card with best value, source chip, trend, expandable Progress chart + History.
  - 🐞 A session-completion tick ALONE leaves Records empty — Records reads only 1RM + benchmark tables. Log a 1RM (or benchmark) to show it alive.
- **Profile** (`/athlete/profile`): **"Set weight"** (kg) → **"Save"**; **"Set height"** (cm); **avatar** upload (jpeg/png/webp/gif, ≤2 MB); **Details** card Gender / Health status / note. Per-field auto-save (no Save button).
  - 🐞 Avatar fails if `BLOB_READ_WRITE_TOKEN` missing on platform (it's set — should work) or photo >2 MB / HEIC.

## Phase 10 — Coach dashboard comes alive (Browser A)

- Back to `/coach`.
- **Expect:** now a **real dashboard** (not the empty state): today's roster, planned/completed counts, engagement — because there's an assigned + active athlete with activity.
- 🐞 Metrics are cached (short TTL) — fresh activity may lag a few seconds.

## Phase 11 (optional) — Marketing CMS (Browser A, admin)

- admin `/login` (same head coach) → lands on dashboard.
- **Blog:** `/blog/create` → fill → **tick "Published"** (defaults OFF!) → save. **Products/Reviews:** create (default visible). **Pages** are edit-only (seeded).
- Check marketing site shows it.
- 🐞 Marketing is 5-min ISR (`revalidate = 300`) — new content lags up to 5 min; create it ahead of the demo. Forgotten "Published" = empty `/blog`.

---

## Ready-made marketing content (copy-paste)

On-brand for Coach Denys (CrossFit / weightlifting / adaptive, motto _"Your discipline dictates your success"_, the "plan as a train" philosophy). Language EN to match the site. Slugs auto-generate — don't type them. Prices in USD (swap currency if you prefer UAH/EUR).

### Products (admin `/products/create`) — create all 3, leave "Active" ON

**1. Group Training — Monthly** _(mark "Featured")_

- **Description:** The flagship Discipline Program. A new, fully structured workout every day — CrossFit, strength, and conditioning — programmed by Coach Denys and scaled to your level. Get on the train and keep moving.
- **Features:** `New workout every day` · `Strength + conditioning + skill` · `Scaled & RX options` · `Coach feedback on your logged sessions`
- **Price:** `49` · USD · interval `month`

**2. Personalized Programming**

- **Description:** Your own plan, built around your goals, schedule, and equipment. One-on-one programming and direct coaching from Denys — for competitors and busy professionals who need a plan that fits their life.
- **Features:** `1:1 goal setting` · `Individualised weekly plan` · `Direct messaging with your coach` · `Monthly progress review`
- **Price:** `149` · USD · interval `month`

**3. Adaptive CrossFit**

- **Description:** Functional training adapted for injury recovery and limited mobility — including rehab for post-injury and wounded athletes. Train hard, train safe, under personal supervision.
- **Features:** `Injury-aware scaling` · `Rehab-focused progressions` · `Built for every ability` · `Personal supervision`
- **Price:** `99` · USD · interval `month`

### Reviews (admin `/reviews/create`) — create all 3, "Active" ON, rating 5

| Text                                                                                                                                                              | authorName | authorRole               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------ |
| Three years on The Discipline Program. I went from skipping the gym to competing in my first throwdown. The structure is everything — I just show up and execute. | Andrii K.  | Group athlete, 3 years   |
| After my injury I thought serious training was over for me. Denys rebuilt me step by step. I'm stronger now than I was before.                                    | Maryna T.  | Adaptive program         |
| The personalized plan fits my insane schedule. No guesswork, no wasted sessions. Discipline really does dictate the results.                                      | Oleh V.    | Personalized programming |

### Blog post (admin `/blog/create`) — ⚠️ tick **"Published"**

- **Title:** `Your Discipline Dictates Your Success`
- **Category:** `Mindset`
- **Tags:** `discipline` · `consistency` · `mindset`
- **Excerpt:** Motivation gets you started. Discipline is what keeps the train moving — every single day.
- **Cover image:** skip, or upload any image
- **Content (Markdown):**

```markdown
## The train doesn't wait

A training plan is like a train. It runs on a schedule — one passenger or a hundred, it keeps moving. Miss a day and that day has already left the station. There's no going back to repeat it.

That's the core of The Discipline Program. We don't chase motivation and we don't do make-up sessions for missed days. We build the habit of showing up — today, tomorrow, and the day after.

## Consistency beats intensity

The athlete who trains at 80% every day will out-build the one who goes 100% twice a week and burns out. Strength, endurance, skill — it's all compound interest. Small, disciplined deposits, paid daily.

## Get on the train

You don't need to feel ready. You need to get on the train. Set your schedule, log your work, trust the process — and your discipline will dictate your success.

Welcome aboard.
```

### Pages (admin `/pages` → open each page → edit section by section)

Each section saves on its own. **Button/form/modal micro-labels are usually pre-seeded — fill only if blank** (given here in `(parens)`). Image fields (`backgroundImage`, personal `image`) — keep existing or upload. `iconName` takes any MUI icon name. ⚠️ **About-page years/credentials are from your bio — verify with Denys before showing.**

#### HOME (`/`)

**hero**

- title: `Your discipline dictates your success`
- subtitle: `Structured daily training for CrossFit, strength, and conditioning — coached by Denys, built for everyone from first-timers to elite competitors.`
- buttonText: `See the programs` · buttonHref: `/storefront`

**whyChoose**

- title: `Why train with The Discipline Program`
- subtitle: `No fluff, no guesswork — a plan that works if you show up.`
- features (4):
  1. `A plan, not a feed` — `Every day is programmed with intent: strength, conditioning, and skill in the right dose. You just execute.` · icon `AssignmentTurnedIn`
  2. `Coached, not automated` — `12+ years of coaching behind every progression. Log your work and get real feedback.` · icon `SelfImprovement`
  3. `Built for every level` — `From your first pull-up to the competition floor, every workout scales to you.` · icon `TrendingUp`
  4. `Discipline over motivation` — `The train runs on schedule. Miss a day and it moves on — consistency is the whole game.` · icon `Schedule`

**storefront**

- title: `Find your program` · subtitle: `Group, personalized, or adaptive — pick the path that fits your goals.`
- buttonText: `Browse all programs` · buttonHref: `/storefront`
- _(freeLabel `Free` · cardActionLabel `Learn more` · modalDismissLabel `Close` · modalActionLabel `Get started`)_

**reviews**

- title: `What athletes say` · subtitle: `Real people, real consistency, real results.`

**contact**

- title: `Ready to get on the train?` · subtitle: `Tell us your goals and we'll point you to the right program.`
- buttonText: `Get in touch` · buttonHref: `/contact`

#### STOREFRONT (`/storefront`)

**hero**

- title: `Training programs` · subtitle: `Choose your path: group programming, one-on-one design, or adaptive training for recovery.`
- buttonText: `Talk to the coach` · buttonHref: `/contact`

**grid**

- title: `All programs` · subtitle: `Every program runs on the same principle — structure, consistency, discipline.`
- _(freeLabel `Free` · modalDismissLabel `Close` · modalActionLabel `Get started`)_

**cta**

- title: `Not sure which fits?` · subtitle: `Send a message — we'll match you to the right program for your goals and schedule.`
- buttonText: `Contact the coach` · buttonHref: `/contact`

#### ABOUT (`/about`) — ⚠️ verify years/facts with Denys

**hero**

- title: `Coach Denys` · subtitle: `12+ years turning discipline into performance — from first-timers to Olympians.`
- buttonText: `See the programs` · buttonHref: `/storefront`

**journey** (timeline)

- title: `The journey` · subtitle: `From competitor to coach.`
- timeline:
  1. `2013` — `Started coaching` — `Began coaching CrossFit, weightlifting, and athletics — the foundations of the method.`
  2. `2018` — `Into competition` — `Competed at KyivBattle in the Amateur category.`
  3. `2019` — `Amateur to Elite` — `Reached the Elite category at Dog Autumn Showdown in a single season.`
  4. `Today` — `The Discipline Program` — `100+ athletes training in person and online on one disciplined system.`

**credentials**

- title: `Credentials` · subtitle: `The education and experience behind the coaching.`
- items:
  1. `Wingate Institute` — `Full degree from the Zinman College of Physical Education & Sport Sciences, Israel.`
  2. `12+ years coaching` — `CrossFit, weightlifting, bodybuilding, athletics, and rehabilitation.`
  3. `Elite competitor` — `Reached the Elite category of the Ukrainian CrossFit scene.`
  4. `Adaptive & rehab` — `Training injured athletes and veterans through recovery.`

**personal**

- title: `The person behind the program` · subtitle: `Coach, competitor, lifelong athlete.`
- description: `Based in Lviv, training 100+ athletes in person and online. Barbell, endurance, winter sport — I practise what I program. My job is simple: keep you disciplined and keep you progressing.`
- name: `Denys Linetskiy` · role: `Founder & Head Coach` · image: _(upload a photo)_

**cta**

- title: `Train with intent` · subtitle: `Pick a program and get on the train.`
- buttonText: `See the programs` · buttonHref: `/storefront`

#### BLOG (`/blog`)

**hero**

- title: `The Discipline Blog` · subtitle: `Training, recovery, mindset, and the discipline that ties it all together.`

**grid**

- title: `Latest articles` · subtitle: `Read, apply, repeat.`
- _(readMoreLabel `Read more` · minReadSuffix `min read` · readArticleLabel `Read article` · notPublishedLabel `Coming soon`)_

**related**

- title: `Related articles`

#### CONTACT (`/contact`)

**hero**

- title: `Get in touch` · subtitle: `Questions about a program or coaching? Let's talk.`
- buttonText: `See the programs` · buttonHref: `/storefront`

**form**

- title: `Send a message` · subtitle: `Tell us your goals and we'll get back to you personally.`
- successTitle: `Message sent!` · successMessage: `Thanks for reaching out — we'll get back to you soon.`
- _(submitLabel `Send message` · sendAnotherLabel `Send another` · sendingLabel `Sending…` · errorMessage `Something went wrong. Please try again.`)_
- fieldLabels: name `Your name` · contact `Phone, Telegram, or email` · program `Program of interest` · message `Message (optional)`
- fieldPlaceholders: contact `How can we reach you?` · message `Tell us about your goals…`

#### FAQ (`/faq`)

**hero**

- title: `Frequently asked questions` · subtitle: `Everything you need to know before you start.`
- buttonText: `See the programs` · buttonHref: `/storefront`

**content** (Q&A)

- title: `Questions & answers` · subtitle: `Still unsure? Reach out any time.`
- items:
  1. Q `Do I need to be fit to start?` — A `No. Every workout scales to your level — beginners and competitors train from the same plan, adjusted to where you are.`
  2. Q `What equipment do I need?` — A `It depends on the program. Group programming assumes basic gym access; we'll tell you exactly what each program needs before you commit.`
  3. Q `What if I miss a day?` — A `The plan runs like a train — miss a day and it moves on. No make-up sessions. Just get back on the next day; consistency is the point.`
  4. Q `Can I train online?` — A `Yes. Most athletes train remotely — get the plan, log your work, and get feedback wherever you are.`
  5. Q `Is there a free trial?` — A `Reach out and we'll find the best way for you to get started.`
  6. Q `Do you coach injured athletes?` — A `Yes — adaptive training and rehab are a core specialty, including recovery for post-injury and wounded athletes.`

**cta**

- title: `Still have questions?` · subtitle: `Send a message and get a personal answer.`
- buttonText: `Contact the coach` · buttonHref: `/contact`

---

## The hard rules (don't trip on stage)

1. Two browsers (role cage). 2. Self-inbox invite (Resend sandbox). 3. Order: invite → **claim** → **activate** → enroll. 4. Don't double-tap complete. 5. Integers for loads. 6. Log a 1RM so Records isn't empty. 7. Tick "Published" for blog.
