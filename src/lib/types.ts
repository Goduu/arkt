export type DiagramId = string;

export type NodeKind =
  | "rectangle"
  | "ellipse"
  | "text"
  | "container"
  | "virtual";

export interface DiagramNodeDataBase {
  label: string;
  description?: string;
  childDiagramId?: DiagramId; // if present, node is expandable to a sub-diagram
  fillColor?: string;
  textColor?: string;
  fontSize?: number;
  borderColor?: string;
  // Optional small icon to render on the node as a type indicator
  iconKey?: string;
  // If present, this node is a virtual reference to another node id
  // Virtual nodes mirror the target node's label and cannot be edited
  virtualOf?: string;
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
  color?: string;
  background?: string;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeKind;
  label?: DiagramEdgeLabel;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  dashed?: boolean;
  animated?: boolean;
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

export interface NodeTemplateMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface NodeTemplate extends NodeTemplateMeta {
  type: NodeKind;
  width?: number;
  height?: number;
  rotation?: number;
  data: Pick<DiagramNodeDataBase, "fillColor" | "textColor" | "iconKey" | "borderColor"> & { label?: string };
}

export interface AppStateSnapshot {
  diagrams: Record<DiagramId, Diagram>;
  rootId: DiagramId;
  nodeTemplates?: Record<string, NodeTemplate>;
}

export const DEFAULT_COLORS = {
  fill: "#ffffff",
  text: "#111827",
} as const;

export type FlattenedNode = { nodeId: string; label: string; diagramId: string; pathIds: string[]; pathLabels: string[]; nodeType: DiagramNode["type"] };

// React Flow runtime data mirrors used in FlowEditor
export type RFArchEdgeData = {
  shape?: "straight" | "bezier" | "smoothstep" | "step";
  strokeColor?: string;
  strokeWidth?: number;
  dashed?: boolean;
  animated?: boolean;
  label?: string;
  fontSize?: number;
  labelColor?: string;
  labelBackground?: string;
};

export type RFArchNodeData = {
  label: string;
  description?: string;
  fillColor?: string;
  textColor?: string;
  fontSize?: number;
  borderColor?: string;
  iconKey?: string;
  nodeKind?: NodeKind;
  rotation?: number;
  width?: number;
  height?: number;
  virtualOf?: string;
  onLabelCommit?: (next: string) => void;
};