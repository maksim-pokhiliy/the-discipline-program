import type { NodeId } from "../compose-tree.types";

const brand = (raw: string): NodeId => raw as NodeId;

export const makeNodeId = (): NodeId => brand(crypto.randomUUID());

export const asNodeId = (raw: string): NodeId => brand(raw);
