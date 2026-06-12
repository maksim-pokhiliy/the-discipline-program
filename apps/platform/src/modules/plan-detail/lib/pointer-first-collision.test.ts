import type { CollisionDetection, ClientRect } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { pointerFirstCollision } from "./pointer-first-collision";

const rect = (top: number, height: number): ClientRect => ({
  top,
  bottom: top + height,
  left: 0,
  right: 100,
  width: 100,
  height,
});

type CollisionArgs = Parameters<CollisionDetection>[0];

const makeArgs = (pointer: { x: number; y: number } | null): CollisionArgs => {
  const rects = new Map<string, ClientRect>([
    ["schema:a", rect(0, 50)],
    ["group:b", rect(60, 300)],
  ]);

  return {
    active: { id: "schema:a" },
    collisionRect: rect(0, 50),
    droppableRects: rects,
    droppableContainers: [...rects.keys()].map((id) => ({
      id,
      rect: { current: rects.get(id) ?? null },
    })),
    pointerCoordinates: pointer,
  } as unknown as CollisionArgs;
};

describe("pointerFirstCollision", () => {
  it("targets the droppable under the pointer regardless of size", () => {
    const collisions = pointerFirstCollision(makeArgs({ x: 50, y: 70 }));

    expect(collisions[0]?.id).toBe("group:b");
  });

  it("falls back to closestCorners when the pointer is over no droppable", () => {
    const collisions = pointerFirstCollision(makeArgs({ x: 50, y: 55 }));

    expect(collisions.length).toBeGreaterThan(0);
  });
});
