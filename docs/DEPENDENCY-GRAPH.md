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
B["email"]
C["env"]
D["errors"]
E["eslint-config"]
F["mui"]
G["query"]
H["shared"]
I["ui"]
end
1-->E
1-->H
1-->8
1-->C
1-->I
1-->9
1-->7
1-->A
1-->D
1-->F
1-->G
1-->6
2-->E
2-->H
2-->8
2-->C
2-->7
2-->A
2-->D
2-->I
2-->F
2-->G
2-->6
3-->E
3-->H
3-->8
3-->C
3-->D
3-->I
3-->7
3-->9
3-->A
3-->F
3-->G
3-->6
4-->F
4-->E
4-->I
6-->D
6-->9
6-->C
6-->E
7-->H
7-->D
7-->9
7-->A
7-->E
8-->7
8-->H
8-->D
8-->C
8-->A
8-->B
8-->6
8-->E
9-->A
9-->C
9-->D
9-->E
A-->E
B-->E
C-->E
D-->E
F-->H
F-->E
G-->E
H-->E
I-->A
I-->H
I-->E
I-->F
```
