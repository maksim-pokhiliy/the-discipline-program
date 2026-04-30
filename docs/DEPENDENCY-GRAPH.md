# Dependency graph

Auto-generated from [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs).
Refresh with `pnpm dep:graph`.

The graph is collapsed to package / app level (one node per directory under
`packages/` or `apps/`) so it stays readable. For the full file-level
view, run `pnpm exec depcruise --output-type dot packages apps | dot -Tsvg`.

This graph is enforced at the file-import level by
[`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs) and the
dependency-direction rules documented in
[`BOUNDED-CONTEXTS.md` §8](./BOUNDED-CONTEXTS.md). Any pull request that
introduces a forbidden edge will fail `pnpm dep:check` both locally
(husky pre-push) and in CI (`.github/workflows/ci.yml`).

```mermaid
flowchart LR

subgraph 0["apps"]
1["admin"]
2["marketing"]
3["platform"]
4["storybook"]
end
subgraph 5["packages"]
6["api-client"]
7["api-routes"]
8["api-server"]
9["auth"]
A["contracts"]
B["env"]
C["errors"]
D["eslint-config"]
E["mui"]
F["query"]
G["shared"]
H["ui"]
end
1-->D
1-->B
1-->H
1-->9
1-->7
1-->8
1-->A
1-->C
1-->E
1-->F
1-->6
1-->G
2-->D
2-->B
2-->7
2-->8
2-->A
2-->C
2-->E
2-->F
2-->6
2-->H
2-->G
3-->D
3-->B
3-->H
3-->9
3-->7
3-->8
3-->A
3-->E
3-->F
3-->6
3-->G
4-->E
4-->D
6-->C
6-->9
6-->B
6-->D
7-->B
7-->C
7-->9
7-->A
7-->D
8-->A
8-->B
8-->C
8-->G
8-->D
9-->A
9-->B
9-->C
9-->D
A-->D
B-->D
C-->D
E-->G
E-->D
F-->D
G-->D
H-->G
H-->D
H-->E
```
