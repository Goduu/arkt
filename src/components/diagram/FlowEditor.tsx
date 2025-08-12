"use client";

import * as React from "react";
import ReactFlow, {
  addEdge as rfAddEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge as RFEdge,
  type OnConnect,
  type Node as RFNode,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode, SubDiagram } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Upload, CornerUpLeft } from "lucide-react";
import { ArchNode } from "@/components/diagram/nodes/ArchNode";
import { NodeControls } from "./NodeControls";
import { EdgeControls } from "@/components/diagram/EdgeControls";
import { nanoid } from "nanoid";

function toRFNode(n: DiagramNode, opts?: { onLabelCommit?: (id: string, next: string) => void }): RFNode {
  const baseData: any = {
    label: n.data.label,
    description: n.data.description,
    fillColor: n.data.fillColor,
    textColor: n.data.textColor,
    nodeKind: n.type,
    rotation: n.rotation ?? 0,
    width: n.width,
    height: n.height,
  };
  if (opts?.onLabelCommit) {
    baseData.onLabelCommit = (next: string) => opts.onLabelCommit!(n.id, next);
  }
  return { id: n.id, position: n.position, data: baseData, type: "archNode", style: { width: n.width ?? 180, height: n.height ?? 80 } } satisfies RFNode;
}

function toRFEdge(e: DiagramEdge): RFEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type === "smoothstep" ? "smoothstep" : e.type === "step" ? "step" : e.type === "bezier" ? "bezier" : "default",
    label: e.label?.text,
    markerStart: e.arrowStart ? { type: MarkerType.ArrowClosed } : undefined,
    markerEnd: e.arrowEnd !== false ? { type: MarkerType.ArrowClosed } : undefined,
  } satisfies RFEdge;
}

export function FlowEditor() {
  const { diagrams, currentId, setNodesEdges, addNode } = useAppStore();
  const diagram: Diagram | undefined = diagrams[currentId];

  // Drill stack of node ids we navigated into; empty means top-level diagram
  const [drillStack, setDrillStack] = React.useState<string[]>([]);

  const isNestedView = drillStack.length > 0;

  const getNestedDiagram = React.useCallback((sourceNodes: DiagramNode[], stack: string[]): SubDiagram => {
    if (stack.length === 0) return { nodes: sourceNodes, edges: diagram?.edges ?? [] };
    const [head, ...rest] = stack;
    const found = sourceNodes.find((n) => n.id === head);
    if (!found) return { nodes: [], edges: [] };
    if (rest.length === 0) return found.diagram ?? { nodes: [], edges: [] };
    return getNestedDiagram(found.diagram?.nodes ?? [], rest);
  }, [diagram?.edges]);

  const currentDomain = React.useMemo(() => {
    if (!diagram) return { nodes: [] as DiagramNode[], edges: [] as DiagramEdge[] };
    if (drillStack.length === 0) return { nodes: diagram.nodes, edges: diagram.edges };
    return getNestedDiagram(diagram.nodes, drillStack);
  }, [diagram, drillStack, getNestedDiagram]);

  const initialNodes = React.useMemo(() =>
    (currentDomain.nodes ?? []).map((n) => toRFNode(n, isNestedView ? {
      onLabelCommit: (id, next) => {
        // reflect immediately in RF; persistence handled by autosave
        setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn)));
      },
    } : undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [diagram?.id, drillStack]
  );
  const initialEdges = React.useMemo(() => (currentDomain.edges ?? []).map(toRFEdge), [currentDomain.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = React.useState<RFEdge | null>(null);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNodes((currentDomain.nodes ?? []).map((n) => toRFNode(n, isNestedView ? {
      onLabelCommit: (id, next) => setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn))),
    } : undefined)));
    setEdges((currentDomain.edges ?? []).map(toRFEdge));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram?.id, drillStack]);

  const onConnect: OnConnect = React.useCallback((connection: Connection) => {
    setEdges((eds) => rfAddEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, [setEdges]);

  // Refs to persist latest graph state on unmount/navigation
  const nodesRef = React.useRef<RFNode[]>(nodes);
  const edgesRef = React.useRef<RFEdge[]>(edges);
  const diagramIdRef = React.useRef<string | undefined>(diagram?.id);
  const drillStackRef = React.useRef<string[]>(drillStack);
  React.useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  React.useEffect(() => { edgesRef.current = edges; }, [edges]);
  React.useEffect(() => { diagramIdRef.current = diagram?.id; }, [diagram?.id]);
  React.useEffect(() => { drillStackRef.current = drillStack; }, [drillStack]);

  const syncToStore = React.useCallback(() => {
    const id = diagramIdRef.current;
    if (!id) return;
    const currentStore = useAppStore.getState();
    const existing = currentStore.diagrams[id];
    if (!existing) return;

    const rfNodes = nodesRef.current;
    const rfEdges = edgesRef.current;

    const toDomainNodes = (baseNodes: DiagramNode[]) => rfNodes.map((n) => ({
      id: n.id,
      type: (n.data as any)?.nodeKind ?? "rectangle",
      position: n.position,
      data: {
        label: String((n.data as any)?.label ?? ""),
        description: (n.data as any)?.description,
        fillColor: (n.data as any)?.fillColor,
        textColor: (n.data as any)?.textColor,
      },
      width: (n as any).style?.width ?? (n.data as any)?.width ?? 180,
      height: (n as any).style?.height ?? (n.data as any)?.height ?? 80,
      rotation: (n.data as any)?.rotation ?? 0,
      diagram: baseNodes.find((bn) => bn.id === n.id)?.diagram ?? { nodes: [], edges: [] },
    } satisfies DiagramNode));

    const stack = drillStackRef.current;
    if (stack.length === 0) {
      const asDomainNodes = toDomainNodes(existing.nodes);
      const asDomainEdges: DiagramEdge[] = rfEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type === "smoothstep" || e.type === "step" || e.type === "bezier" ? e.type : "straight",
        label: e.label ? { text: String(e.label) } : undefined,
        arrowStart: Boolean((e as any).markerStart),
        arrowEnd: Boolean((e as any).markerEnd),
      }));
      setNodesEdges(id, asDomainNodes, asDomainEdges);
      return;
    }

    const replaceNested = (nodes: DiagramNode[], path: string[], replacement: SubDiagram): DiagramNode[] => {
      if (path.length === 0) return replacement.nodes;
      const [head, ...rest] = path;
      return nodes.map((node) =>
        node.id === head
          ? { ...node, diagram: rest.length === 0 ? replacement : { nodes: replaceNested(node.diagram?.nodes ?? [], rest, replacement), edges: node.diagram?.edges ?? [] } }
          : node
      );
    };
    const baseNested = (() => {
      let sub: SubDiagram = { nodes: existing.nodes as DiagramNode[], edges: existing.edges as DiagramEdge[] };
      for (const nid of stack) {
        const found = (sub.nodes ?? []).find((n) => n.id === nid);
        if (!found) return { nodes: [], edges: [] } as SubDiagram;
        sub = found.diagram ?? { nodes: [], edges: [] };
      }
      return sub;
    })();
    const updatedNestedNodes = toDomainNodes(baseNested.nodes ?? []);
    const updatedNestedEdges: DiagramEdge[] = rfEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type === "smoothstep" || e.type === "step" || e.type === "bezier" ? e.type : "straight",
      label: e.label ? { text: String(e.label) } : undefined,
      arrowStart: Boolean((e as any).markerStart),
      arrowEnd: Boolean((e as any).markerEnd),
    }));
    const updatedTop = replaceNested(existing.nodes, stack, { nodes: updatedNestedNodes, edges: updatedNestedEdges });
    setNodesEdges(id, updatedTop, existing.edges);
  }, [setNodesEdges]);

  // Debounced autosave when nodes/edges change
  const saveTimer = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      syncToStore();
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, syncToStore]);

  // Persist on unmount (e.g., when navigating via breadcrumb)
  React.useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      syncToStore();
    };
  }, [syncToStore]);

  const onAddNode = () => {
    if (!diagram) return;
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "rectangle",
        position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
        width: 180,
        height: 80,
        data: { label: "Node" },
        diagram: { nodes: [], edges: [] },
      });
      setNodes((prev) => [...prev, toRFNode({ id, type: "rectangle", position: { x: 100, y: 100 }, data: { label: "Node" }, width: 180, height: 80, diagram: { nodes: [], edges: [] } })]);
      return;
    }
    const id = nanoid();
    setNodes((prev) => [...prev, toRFNode({ id, type: "rectangle", position: { x: 100, y: 100 }, data: { label: "Node" }, width: 180, height: 80, diagram: { nodes: [], edges: [] } })]);
    // persistence handled by autosave
  };

  const onBack = () => {
    ensureSyncedThen(() => setDrillStack((prev) => prev.slice(0, -1)));
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram-${diagram?.name ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileRef = React.useRef<HTMLInputElement>(null);
  const onImportClick = () => fileRef.current?.click();
  const onImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !diagram) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as { nodes: RFNode[]; edges: RFEdge[] };
      setNodes(parsed.nodes);
      setEdges(parsed.edges);
      setTimeout(syncToStore, 0);
    } catch {
      // ignore
    }
  };

  const nodeTypes = React.useMemo(() => ({ archNode: ArchNode }), []);

  const ensureSyncedThen = React.useCallback((after: () => void) => {
    // Persist current visual state to store before navigation
    syncToStore();
    // Give store a microtask to update
    setTimeout(after, 0);
  }, [syncToStore]);

  const onNodeDoubleClick = React.useCallback((_: React.MouseEvent, node: RFNode) => {
    ensureSyncedThen(() => setDrillStack((prev) => [...prev, node.id]));
  }, [ensureSyncedThen]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-2 border-b p-2">
        <Button size="sm" onClick={onAddNode}>Add node</Button>
        {isNestedView && (
          <Button size="sm" variant="outline" onClick={onBack}><CornerUpLeft className="mr-2 h-4 w-4" /> Back</Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          <Button size="sm" variant="outline" onClick={onImportClick}><Upload className="mr-2 h-4 w-4" /> Import</Button>
          <Button size="sm" onClick={onExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button size="sm" onClick={syncToStore}>Save</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          nodesConnectable
          onSelectionChange={(sel) => {
            const e = (sel?.edges ?? [])[0] as RFEdge | undefined;
            setSelectedEdge(e ?? null);
            const n = (sel?.nodes ?? [])[0];
            setSelectedNodeId(n?.id ?? null);
          }}
          fitView
        >
          <Background gap={16} />
          <MiniMap />
          <Controls />
        </ReactFlow>
        <NodeControls
          selectedNode={selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null}
          onChange={(node: RFNode) => {
            setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
          }}
          onClose={() => setSelectedNodeId(null)}
        />
        <EdgeControls
          selectedEdge={selectedEdge}
          onChange={(edge) => {
            setEdges((prev) => prev.map((e) => (e.id === edge.id ? edge : e)));
          }}
        />
      </div>
    </div>
  );
}


