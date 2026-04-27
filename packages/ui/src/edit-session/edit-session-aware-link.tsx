"use client";

import { type UrlObject } from "url";

import { type MouseEvent, type Ref, forwardRef } from "react";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";

import { useEditSessionOrchestrator } from "./use-edit-session-orchestrator";

type AnchorAttributes = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps | "ref"
>;

export type EditSessionAwareLinkProps = LinkProps &
  AnchorAttributes & {
    children?: React.ReactNode;
  };

const isModifierClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

const stringifyQuery = (query: UrlObject["query"]): string => {
  if (!query) {
    return "";
  }

  if (typeof query === "string") {
    return query;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }

      continue;
    }

    params.append(key, String(value));
  }

  return params.toString();
};

const formatHref = (href: LinkProps["href"]): string => {
  if (typeof href === "string") {
    return href;
  }

  const pathname = href.pathname ?? "";
  const search =
    href.search ?? (stringifyQuery(href.query) ? `?${stringifyQuery(href.query)}` : "");
  const hash = href.hash ?? "";

  return `${pathname}${search}${hash}`;
};

export const EditSessionAwareLink = forwardRef<HTMLAnchorElement, EditSessionAwareLinkProps>(
  function EditSessionAwareLink({ onClick, href, ...rest }, ref: Ref<HTMLAnchorElement>) {
    const orchestrator = useEditSessionOrchestrator();
    const router = useRouter();

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (!orchestrator) {
        return;
      }

      if (isModifierClick(event)) {
        return;
      }

      const navHref = formatHref(href);

      event.preventDefault();
      void orchestrator.requestRouteChangeFlush().then((result) => {
        if (result === "proceed") {
          router.push(navHref);
        }
      });
    };

    return <Link ref={ref} href={href} onClick={handleClick} {...rest} />;
  },
);
