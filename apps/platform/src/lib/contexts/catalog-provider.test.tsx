import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { CatalogProvider } from "@app/lib/contexts";
import { useCatalog } from "@app/lib/hooks/use-catalog";
import { render } from "@app/test/render";

import { makeExercise } from "../../modules/plan-detail/components/schema-row-card.fixtures";

const exercisesState: { data: Exercise[] | undefined } = { data: [] };

vi.mock("@app/lib/hooks/use-exercises", () => ({
  useExercises: () => ({ data: exercisesState.data }),
}));

const EXERCISE_ID = "ckabc1234567890abcdef01234";

const Probe = () => {
  const { exerciseById } = useCatalog();

  return (
    <div
      data-testid="catalog-probe"
      data-exercise-size={String(exerciseById.size)}
      data-exercise-name={exerciseById.get(EXERCISE_ID)?.canonicalName ?? "none"}
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
});

describe("CatalogProvider graceful fallback (QA-Must-11)", () => {
  it("renders an empty Map without throwing when the hook has undefined data (loading or error)", () => {
    exercisesState.data = undefined;

    expect(() => renderProbe()).not.toThrow();

    const probe = screen.getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "0");
  });
});

describe("CatalogProvider with empty arrays", () => {
  it("renders an empty Map when the hook returns an empty array", () => {
    exercisesState.data = [];

    const probe = renderProbe().getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "0");
  });
});

describe("CatalogProvider with populated data", () => {
  it("keys exerciseById by id and resolves a get() to the right entity", () => {
    const OTHER_EXERCISE_ID = "ckxyz1234567890abcdef01234";

    exercisesState.data = [
      makeExercise({ id: EXERCISE_ID, canonicalName: "Back Squat" }),
      makeExercise({ id: OTHER_EXERCISE_ID, canonicalName: "Deadlift" }),
    ];

    const probe = renderProbe().getByTestId("catalog-probe");

    expect(probe).toHaveAttribute("data-exercise-size", "2");
    expect(probe).toHaveAttribute("data-exercise-name", "Back Squat");
  });
});
