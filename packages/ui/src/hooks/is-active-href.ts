export const isActiveHref = (href: string, pathname: string, exact?: boolean): boolean => {
  if (exact || href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};
