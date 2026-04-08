"use client";

import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";
import { CollapsibleList } from "@repo/ui";

import { useResolveActionItem } from "@app/lib/hooks";

import { ActionMenu, AthleteCard, DashboardSection } from "../components";

import {
  INITIAL_VISIBLE_COUNT,
  getChip,
  getSeverityColor,
  sortBySeverity,
} from "./action-items-config";

type ActionItemsSectionProps = {
  items: DashboardActionItem[];
};

export const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({ items }) => {
  const resolveMutation = useResolveActionItem();

  if (items.length === 0) {
    return null;
  }

  const sorted = sortBySeverity(items);

  const rendered = sorted.map((item) => {
    const chip = getChip(item);
    const isResolving = resolveMutation.isPending && resolveMutation.variables === item.id;

    return (
      <AthleteCard
        key={item.id}
        name={item.athleteName ?? "Unknown"}
        image={item.athleteImage}
        severity={getSeverityColor(item.severity)}
        message={item.message}
        chips={chip ? [chip] : undefined}
        action={
          <ActionMenu
            itemId={item.id}
            href={item.href}
            onResolve={resolveMutation.mutate}
            isResolving={isResolving}
          />
        }
      />
    );
  });

  return (
    <DashboardSection title="Needs Attention" badge={{ label: items.length, color: "error" }}>
      <CollapsibleList items={rendered} initialCount={INITIAL_VISIBLE_COUNT} />
    </DashboardSection>
  );
};
