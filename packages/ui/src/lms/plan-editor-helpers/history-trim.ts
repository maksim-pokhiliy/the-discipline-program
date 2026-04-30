export const trimHistoryStack = <T>(stack: readonly T[], capacity: number): T[] => {
  if (stack.length <= capacity) {
    return [...stack];
  }

  return stack.slice(stack.length - capacity);
};
