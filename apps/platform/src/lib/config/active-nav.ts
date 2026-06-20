import { type PlatformNavItem } from "@repo/shared";

export const getActiveNavIndex = (items: PlatformNavItem[], pathname: string): number =>
  items.reduce<number>((bestIndex, item, index) => {
    if (!pathname.startsWith(item.href)) {
      return bestIndex;
    }

    if (bestIndex === -1) {
      return index;
    }

    const best = items[bestIndex];

    return best && item.href.length > best.href.length ? index : bestIndex;
  }, -1);
