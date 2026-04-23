export type IsActiveHrefOptions = {
  exact?: boolean;
  siblingHrefs?: readonly string[];
};

export const isActiveHref = (
  href: string,
  pathname: string | null,
  optionsOrExact?: boolean | IsActiveHrefOptions,
): boolean => {
  if (!pathname) {
    return false;
  }

  const options: IsActiveHrefOptions =
    typeof optionsOrExact === "boolean" ? { exact: optionsOrExact } : (optionsOrExact ?? {});

  const exact = options.exact ?? false;
  const siblings = options.siblingHrefs ?? [];

  if (exact || href === "/") {
    return pathname === href;
  }

  if (pathname === href) {
    return true;
  }

  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }

  for (const sibling of siblings) {
    if (sibling === href) {
      continue;
    }

    if (!sibling.startsWith(`${href}/`)) {
      continue;
    }

    if (pathname === sibling || pathname.startsWith(`${sibling}/`)) {
      return false;
    }
  }

  return true;
};
