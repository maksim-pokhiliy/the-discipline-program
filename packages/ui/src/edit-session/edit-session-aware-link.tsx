"use client";

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

      if (typeof href !== "string") {
        return;
      }

      event.preventDefault();
      void orchestrator.requestRouteChangeFlush().then((result) => {
        if (result === "proceed") {
          router.push(href);
        }
      });
    };

    return <Link ref={ref} href={href} onClick={handleClick} {...rest} />;
  },
);
