# Rules / invariants

> Durable invariants for the training-domain workflow. Rarely changes.

- `analysis/source/` and `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/` — read-only forever.
- `analysis/artifacts/05-synthesis/` and `06-formalization/` — living source of truth, updated synchronously with every Prisma schema change. Each such update mentioned explicitly in `log/step-NN.md`.
- Every step touching Prisma updates seed в same session; smoke-test scenario cannot be valid without coherent seed.
- Schema changes require thesis approval cycle before prompt finalization.
- Each step lives under `implementation/step-NN/` with `prompt.md` and `output.md`.
- Each step's close-out adds an entry under `implementation/log/step-NN.md` (newest entries always have their own file; historical archive of Steps 1 → 8.0a in `log/_archive-pre-refactor.md`).
- Pre-existing implementations of this domain are deleted (4th attempt). Do not search git history or memory for them. If something surfaces accidentally, halt and surface to user.
- `state/00-current.md` is the entry point для fresh planner session; reads order per WORKFLOW.md § "Session handoff protocol".
