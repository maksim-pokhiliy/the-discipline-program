export type DraggableKind = "block" | "segment" | "entry";

export type DraggableInfo =
  | {
      kind: "block";
      blockId: string;
      sourceSessionId: string;
      sourceIndex: number;
      expectedVersion: number;
    }
  | {
      kind: "segment";
      segmentId: string;
      sourceBlockId: string;
      sourceIndex: number;
      expectedVersion: number;
    }
  | {
      kind: "entry";
      entryId: string;
      sourceSetGroupId: string;
      sourceIndex: number;
      expectedVersion: number;
    };

export type ContainerInfo =
  | { kind: "session"; sessionId: string; blockIds: string[] }
  | { kind: "block"; blockId: string; segmentIds: string[] }
  | { kind: "setGroup"; setGroupId: string; entryIds: string[] };

export type DndLookups = {
  draggables: Map<string, DraggableInfo>;
  containers: Map<string, ContainerInfo>;
  itemToContainer: Map<string, string>;
};
