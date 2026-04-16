export const isActiveHref = (href: string, pathname: string | null, exact?: boolean): boolean => {
  if (!pathname) {
    return false;
  }

  if (exact || href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};
