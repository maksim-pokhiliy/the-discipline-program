"use client";

import { type RefObject, useLayoutEffect, useRef } from "react";

type MoveDirection = "up" | "down";
type MoveFocus = {
  moveUpRef: RefObject<HTMLButtonElement | null>;
  moveDownRef: RefObject<HTMLButtonElement | null>;
  moveKeepingFocus: (direction: MoveDirection, move: () => void) => void;
};

export const useMoveFocus = (): MoveFocus => {
  const moveUpRef = useRef<HTMLButtonElement>(null);
  const moveDownRef = useRef<HTMLButtonElement>(null);
  const pendingDirection = useRef<MoveDirection | null>(null);

  useLayoutEffect(() => {
    const direction = pendingDirection.current;

    if (direction !== null) {
      const control = direction === "up" ? moveUpRef : moveDownRef;

      control.current?.focus();
      pendingDirection.current = null;
    }
  });

  const moveKeepingFocus = (direction: MoveDirection, move: () => void): void => {
    pendingDirection.current = direction;
    move();
  };

  return { moveUpRef, moveDownRef, moveKeepingFocus };
};
