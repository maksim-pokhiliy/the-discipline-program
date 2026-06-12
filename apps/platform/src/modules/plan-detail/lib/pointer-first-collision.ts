import { closestCorners, pointerWithin, type CollisionDetection } from "@dnd-kit/core";

export const pointerFirstCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.length > 0 ? pointerCollisions : closestCorners(args);
};
