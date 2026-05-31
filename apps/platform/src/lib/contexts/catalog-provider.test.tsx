import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Archetype } from "@repo/contracts/lms/archetype";
import type { Exercise } from "@repo/contracts/lms/exercise";

import { CatalogProvider } from "@app/lib/contexts";
import { useCatalog } from "@app/lib/hooks/use-catalog";
import { render } from "@app/test/render";

import { makeExercise } from "../../modules/plan-detail/components/schema-row-card.fixtures";

const exercisesState: { data: Exercise[] | undefined } = { data: [] };
const archetypesState: { data: Archetype[] | undefined } = { data: [] };

vi.mock("@app/lib/hooks/use-exercises", () => ({
  useExercises: () => ({ data: exercisesState.data }),
}));

vi.mock("@app/lib/hooks/use-archetypes", () => ({
  useArchetypes: () => ({ data: archetypesState.data }),
}));

const NOW = new Date("2026-01-06T00:00:00.000Z");
const EXERCISE_ID = "ckabc1234567890abcdef01234";
const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";

const makeArchetype = (overrides: Partial<Archetype> = {}): Archetype => ({
  id: ARCHETYPE_ID,
  name: "n-rounds",
  label: "N Rounds",
  kind: "ATOMIC",
  family: "ROUNDS_SETS",
  headerPatternDescription: "",
  bodyLayoutDescription: "",
  archetypeParamsSchema: {},
  relatedArchetypes: {},
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const Probe = () => {
  const { exerciseById, archetypeById } = useCatalog();

  return (
    <div
      data-testid="catalog-probe"
      data-exercise-size={String(exerciseById.size)}
      data-archetype-size={String(archetypeById.size)}
      data-exercise-name={exerciseById.get(EXERCISE_ID)?.canonicalName ?? "none"}
      data-archetype-label={archetypeById.get(ARCHETYPE_ID)?.label ?? "none"}
    />
  );
};

const renderProbe = () =>
  render(
    <CatalogProvider>
      <Probe />
    </CatalogProvider>,
  );

afterEach(() => {
  exercisesState.data = [];
  archetypesState.data = [];
});

describe("CatalogProvider graceful fallback (QA-Must-11)", () => {
  it("renders an empty Map for both catalogs without throwing when both hooks have undefined data (loading or error)", () => {
    exercisesState.data = undefined;
    archetypesState.data = undefined;

    expect(() => renderProbe()).not.toThrow();

    const probe = screen.getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "0");
    expect(probe).toHaveAttribute("data-archetype-size", "0");
  });

  it("renders an empty exerciseById when only useExercises data is undefined", () => {
    exercisesState.data = undefined;
    archetypesState.data = [makeArchetype()];

    expect(() => renderProbe()).not.toThrow();

    const probe = screen.getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "0");
    expect(probe).toHaveAttribute("data-archetype-size", "1");
  });

  it("renders an empty archetypeById when only useArchetypes data is undefined", () => {
    exercisesState.data = [makeExercise({ id: EXERCISE_ID })];
    archetypesState.data = undefined;

    expect(() => renderProbe()).not.toThrow();

    const probe = screen.getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "1");
    expect(probe).toHaveAttribute("data-archetype-size", "0");
  });
});

describe("CatalogProvider with empty arrays", () => {
  it("renders an empty Map for both catalogs when both hooks return empty arrays", () => {
    exercisesState.data = [];
    archetypesState.data = [];

    const probe = renderProbe().getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "0");
    expect(probe).toHaveAttribute("data-archetype-size", "0");
  });
});

describe("CatalogProvider with populated data", () => {
  it("keys exerciseById and archetypeById by id and resolves a get() to the right entity", () => {
    const OTHER_EXERCISE_ID = "ckxyz1234567890abcdef01234";

    exercisesState.data = [
      makeExercise({ id: EXERCISE_ID, canonicalName: "Back Squat" }),
      makeExercise({ id: OTHER_EXERCISE_ID, canonicalName: "Deadlift" }),
    ];
    archetypesState.data = [makeArchetype({ label: "N Rounds" })];

    const probe = renderProbe().getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "2");
    expect(probe).toHaveAttribute("data-archetype-size", "1");
    expect(probe).toHaveAttribute("data-exercise-name", "Back Squat");
    expect(probe).toHaveAttribute("data-archetype-label", "N Rounds");
  });
});
