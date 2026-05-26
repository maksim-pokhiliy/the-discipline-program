"use client";

import { useMemo } from "react";

import { Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import { AccentGroupCard } from "@repo/ui";

import { type BlockCtx } from "../lib/build-cascade-chips";
import { groupSchemasByAltGroup } from "../lib/group-schemas-by-alt-group";

import { AddSchemaButton } from "./add-schema-button";
import { AltGroupHeader } from "./alt-group-header";
import { SchemaList } from "./schema-list";

const ALT_KEY_PREFIX = "ag-";
const SCHEMA_KEY_PREFIX = "sch-";

type BlockCardBodyProps = {
  block: Block;
  planId: string;
  startDate: string;
};

export const BlockCardBody: React.FC<BlockCardBodyProps> = ({ block, planId, startDate }) => {
  const groups = useMemo(
    () => groupSchemasByAltGroup(block.schemas, block.alternatingGroups),
    [block.schemas, block.alternatingGroups],
  );

  const blockCtx = useMemo<BlockCtx>(
    () => ({ intensity: block.intensity, timeCap: block.timeCap }),
    [block.intensity, block.timeCap],
  );

  return (
    <Stack direction="column" spacing={1.25} sx={(theme) => ({ p: theme.spacing(1.5) })}>
      {groups.map((g) =>
        g.kind === "alt" ? (
          <AccentGroupCard
            key={`${ALT_KEY_PREFIX}${g.group.id}`}
            header={<AltGroupHeader variantsCount={g.schemas.length} />}
          >
            <SchemaList
              planId={planId}
              startDate={startDate}
              blockId={block.id}
              schemas={g.schemas}
              blockCtx={blockCtx}
            />
          </AccentGroupCard>
        ) : (
          <SchemaList
            key={`${SCHEMA_KEY_PREFIX}${g.schema.schema.id}`}
            planId={planId}
            startDate={startDate}
            blockId={block.id}
            schemas={[g.schema]}
            blockCtx={blockCtx}
          />
        ),
      )}

      <AddSchemaButton planId={planId} startDate={startDate} blockId={block.id} />
    </Stack>
  );
};
