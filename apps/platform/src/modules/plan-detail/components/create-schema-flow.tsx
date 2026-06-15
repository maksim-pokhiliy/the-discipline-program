"use client";

import type { NodeId, SchemaDraft } from "./axes/axis-draft.types";
import { ContainerInspector } from "./axes/container-inspector";

type CreateSchemaFlowProps = {
  draft: SchemaDraft;
  onUpdateNode: (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft) => void;
  onRename: (id: NodeId, header: string) => void;
};

export const CreateSchemaFlow: React.FC<CreateSchemaFlowProps> = ({
  draft,
  onUpdateNode,
  onRename,
}) => (
  <ContainerInspector
    container={draft}
    isCreateMode
    headerEditable
    onUpdateNode={onUpdateNode}
    onRename={onRename}
    onDemoteNode={undefined}
  />
);
