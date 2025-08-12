export type DiagramId = string;

export type NodeKind =
  | "rectangle"
  | "ellipse"
  | "text"
  | "container";

export interface DiagramNodeDataBase {
  label: string;
  description?: string;
  childDiagramId?: DiagramId; // if present, node is expandable to a sub-diagram
  fillColor?: string;
  textColor?: string;
}

export interface DiagramNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  rotation?: number;
  data: DiagramNodeDataBase;
  diagram: SubDiagram; // nested diagram rendered inside this node's view
}

export type EdgeKind = "straight" | "smoothstep" | "bezier" | "step";

export interface DiagramEdgeLabel {
  text: string;
  fontSize?: number;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeKind;
  label?: DiagramEdgeLabel;
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface DiagramMeta {
  id: DiagramId;
  name: string;
  parentId?: DiagramId; // for breadcrumbs
  createdAt: number;
  updatedAt: number;
}

export interface Diagram extends DiagramMeta {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface SubDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface AppStateSnapshot {
  diagrams: Record<DiagramId, Diagram>;
  rootId: DiagramId;
}

export const DEFAULT_COLORS = {
  fill: "#ffffff",
  text: "#111827",
} as const;


