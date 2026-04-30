"use client";

import { useMemo } from "react";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";

import { useBlockKindsPageData, useSchemeTemplatesPageData } from "@app/lib/hooks";

import { type InlinePickerOption, InlinePickerPopover } from "./inline-picker-popover";

export type SlashPickerSelection =
  | { kind: "scheme-template"; template: SchemeTemplate }
  | { kind: "block-kind"; blockKind: BlockKind };

export type SlashPickerProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  query: string;
  onSelect: (selection: SlashPickerSelection) => void;
  onClose: () => void;
};

const SCHEME_PREFIX = "tpl";
const BLOCK_KIND_PREFIX = "bk";

export const SlashPicker = ({ open, anchorEl, query, onSelect, onClose }: SlashPickerProps) => {
  const schemeTemplatesQuery = useSchemeTemplatesPageData(
    { search: query, scope: "ALL", take: 20 },
    undefined,
  );
  const blockKindsQuery = useBlockKindsPageData(
    { search: query, scope: "ALL", take: 20 },
    undefined,
  );

  const templateLookup = useMemo(() => {
    const map = new Map<string, SchemeTemplate>();

    for (const template of schemeTemplatesQuery.data?.items ?? []) {
      map.set(template.id, template);
    }

    return map;
  }, [schemeTemplatesQuery.data]);

  const blockKindLookup = useMemo(() => {
    const map = new Map<string, BlockKind>();

    for (const blockKind of blockKindsQuery.data?.items ?? []) {
      map.set(blockKind.id, blockKind);
    }

    return map;
  }, [blockKindsQuery.data]);

  const options = useMemo<InlinePickerOption[]>(() => {
    const templateOptions = (schemeTemplatesQuery.data?.items ?? []).map<InlinePickerOption>(
      (template) => ({
        id: `${SCHEME_PREFIX}:${template.id}`,
        label: template.name,
        description: template.archetypeKind.replace(/_/gu, " ").toLowerCase(),
        group: "Scheme template",
      }),
    );
    const blockKindOptions = (blockKindsQuery.data?.items ?? []).map<InlinePickerOption>(
      (blockKind) => {
        const description = blockKind.description ?? undefined;

        return {
          id: `${BLOCK_KIND_PREFIX}:${blockKind.id}`,
          label: blockKind.name,
          description,
          group: "Block kind",
        };
      },
    );

    return [...templateOptions, ...blockKindOptions];
  }, [blockKindsQuery.data, schemeTemplatesQuery.data]);

  const handleSelect = (option: InlinePickerOption) => {
    const [prefix, rawId] = option.id.split(":");

    if (prefix === SCHEME_PREFIX && rawId) {
      const template = templateLookup.get(rawId);

      if (template) {
        onSelect({ kind: "scheme-template", template });
      }
    } else if (prefix === BLOCK_KIND_PREFIX && rawId) {
      const blockKind = blockKindLookup.get(rawId);

      if (blockKind) {
        onSelect({ kind: "block-kind", blockKind });
      }
    }

    onClose();
  };

  return (
    <InlinePickerPopover
      open={open}
      anchorEl={anchorEl}
      query={query}
      options={options}
      loading={schemeTemplatesQuery.isLoading || blockKindsQuery.isLoading}
      emptyLabel="No templates or block kinds"
      onSelect={handleSelect}
      onClose={onClose}
    />
  );
};
