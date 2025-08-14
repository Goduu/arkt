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
  type OnConnectStart,
  type OnConnectEnd,
  // useReactFlow as useRFInstance,
  useEdgesState,
  useReactFlow,
  useNodesState,
  MarkerType,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode, RFArchEdgeData, RFArchNodeData, SubDiagram } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Upload, CornerUpLeft, Link as LinkIcon, Square } from "lucide-react";
import { ArchNode } from "@/components/diagram/nodes/ArchNode";
import { NodeControls } from "./NodeControls";
import { EdgeControls } from "@/components/diagram/edges/EdgeControls";
import { nanoid } from "nanoid";
import { FocusIntentHandler } from "./FocusIntentHandler";
import { ArchEdge } from "@/components/diagram/edges/ArchEdge";
import { CreateNodeTemplateDialog } from "./CreateNodeTemplateDialog";
import { getIconByKey } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";


function toRFNode(n: DiagramNode, opts?: { onLabelCommit?: (id: string, next: string) => void }): RFNode {
  const baseData: RFArchNodeData = {
    label: n.data.label,
    description: n.data.description,
    fillColor: n.data.fillColor,
    textColor: n.data.textColor,
    borderColor: n.data.borderColor,
    iconKey: n.data.iconKey,
    nodeKind: n.type,
    rotation: n.rotation ?? 0,
    width: n.width,
    height: n.height,
    virtualOf: n.data?.virtualOf,
  };
  if (opts?.onLabelCommit) {
    baseData.onLabelCommit = (next: string) => opts.onLabelCommit && opts.onLabelCommit(n.id, next);
  }
  return { id: n.id, position: n.position, data: baseData, type: "archNode", style: { width: n.width ?? 180, height: n.height ?? 80 } } satisfies RFNode;
}

function toRFEdge(e: DiagramEdge): RFEdge {
  const rf: RFEdge = {
    id: e.id,
    source: e.source,
    target: e.target,
    type: "arch", // custom edge component controls rendering and interactivity
    label: e.label?.text,
    markerStart: e.arrowStart ? { type: MarkerType.ArrowClosed } : undefined,
    markerEnd: e.arrowEnd !== false ? { type: MarkerType.ArrowClosed } : undefined,
    data: {
      shape: e.type,
      strokeColor: e.strokeColor ?? "#4b5563",
      strokeWidth: e.strokeWidth ?? 2,
      dashed: Boolean(e.dashed),
      animated: Boolean(e.animated),
      label: e.label?.text ?? "",
      fontSize: e.label?.fontSize ?? 12,
      labelColor: e.label?.color ?? "#111827",
      labelBackground: e.label?.background ?? "#ffffff",
    },
  };
  return rf;
}

export function FlowEditor() {
  const { diagrams, currentId, setNodesEdges, addNode, navigateTo, drillStack, pushDrill, popDrill, setDrillStack, setPendingFocus, pendingSpawn, setPendingSpawn, nodeTemplates } = useAppStore();
  const diagram: Diagram | undefined = diagrams[currentId];
  const rf = useReactFlow();

  // Drill stack is now global in store

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
  const connectFromHandle = React.useRef<"source" | "target" | null>(null);
  const getSpawnPosition = React.useCallback((nodeWidth: number, nodeHeight: number) => {
    try {
      const container = document.querySelector('.react-flow') as HTMLElement | null;
      const rect = container?.getBoundingClientRect();
      const centerScreenX = rect ? (rect.left + rect.width / 2) : (window.innerWidth / 2);
      const centerScreenY = rect ? (rect.top + rect.height / 2) : (window.innerHeight / 2);
      const hasConverter = typeof (rf as unknown as { screenToFlowPosition?: (p: { x: number; y: number }) => { x: number; y: number } }).screenToFlowPosition === 'function';
      const centerFlow = hasConverter
        ? (rf as unknown as { screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number } }).screenToFlowPosition({ x: centerScreenX, y: centerScreenY })
        : (() => {
          const vp = (rf as unknown as { getViewport: () => { x: number; y: number; zoom: number } }).getViewport();
          return { x: (centerScreenX - vp.x) / vp.zoom, y: (centerScreenY - vp.y) / vp.zoom };
        })();
      return { x: centerFlow.x - nodeWidth / 2, y: centerFlow.y - nodeHeight / 2 };
    } catch {
      return { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 };
    }
  }, [rf]);
  // Spawn node from template when request is present
  React.useEffect(() => {
    if (!pendingSpawn) return;
    const tpl = nodeTemplates[pendingSpawn.templateId];
    if (!tpl || !diagram) {
      setPendingSpawn(null);
      return;
    }
    const nodeWidth = tpl.width ?? 180;
    const nodeHeight = tpl.height ?? 80;
    const position = getSpawnPosition(nodeWidth, nodeHeight);
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: tpl.type,
        position,
        width: nodeWidth,
        height: nodeHeight,
        rotation: tpl.rotation ?? 0,
        data: {
          label: tpl.data.label ?? "Node",
          fillColor: tpl.data.fillColor,
          textColor: tpl.data.textColor,
          borderColor: tpl.data.borderColor,
          iconKey: tpl.data.iconKey,
        },
        diagram: { nodes: [], edges: [] },
      });
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: tpl.type, position, width: nodeWidth, height: nodeHeight, rotation: tpl.rotation ?? 0, data: { label: tpl.data.label ?? "Node", fillColor: tpl.data.fillColor, textColor: tpl.data.textColor, borderColor: tpl.data.borderColor, iconKey: tpl.data.iconKey }, diagram: { nodes: [], edges: [] } }),
      ]);
    } else {
      const id = nanoid();
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: tpl.type, position, width: nodeWidth, height: nodeHeight, rotation: tpl.rotation ?? 0, data: { label: tpl.data.label ?? "Node", fillColor: tpl.data.fillColor, textColor: tpl.data.textColor, borderColor: tpl.data.borderColor, iconKey: tpl.data.iconKey }, diagram: { nodes: [], edges: [] } }),
      ]);
      // persistence handled by autosave
    }
    setPendingSpawn(null);
  }, [pendingSpawn, nodeTemplates, diagram, drillStack.length, addNode, setNodes, setPendingSpawn, getSpawnPosition]);

  React.useEffect(() => {
    setNodes((currentDomain.nodes ?? []).map((n) => toRFNode(n, isNestedView ? {
      onLabelCommit: (id, next) => setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn))),
    } : undefined)));
    setEdges((currentDomain.edges ?? []).map(toRFEdge));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram?.id, drillStack]);

  const onConnect: OnConnect = React.useCallback((connection: Connection) => {
    setEdges((eds) =>
      rfAddEdge(
        {
          ...connection,
          type: "arch",
          markerStart: connectFromHandle.current === "target" ? { type: MarkerType.ArrowClosed } : undefined,
          markerEnd: connectFromHandle.current !== "target" ? { type: MarkerType.ArrowClosed } : undefined,
          data: {
            shape: "straight",
            strokeColor: "#4b5563",
            strokeWidth: 2,
            dashed: false,
            animated: false,
            label: "",
            fontSize: 12,
            labelColor: "#111827",
            labelBackground: "#ffffff",
          },
        } as unknown as RFEdge,
        eds
      )
    );
    connectFromHandle.current = null;
  }, [setEdges]);

  const onConnectStart: OnConnectStart = React.useCallback((_, params) => {
    connectFromHandle.current = params.handleType ?? null;
  }, []);

  const onConnectEnd: OnConnectEnd = React.useCallback(() => {
    // no-op; reset happens in onConnect
  }, []);

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

    const toDomainNodes = (baseNodes: DiagramNode[]) => rfNodes.map((n) => {
      const styleWidth = (n as RFNode).style?.width;
      const styleHeight = (n as RFNode).style?.height;
      const dataWidth = (n.data as RFArchNodeData)?.width;
      const dataHeight = (n.data as RFArchNodeData)?.height;
      const resolvedWidth = typeof styleWidth === "number" ? styleWidth : (typeof dataWidth === "number" ? dataWidth : 180);
      const resolvedHeight = typeof styleHeight === "number" ? styleHeight : (typeof dataHeight === "number" ? dataHeight : 80);
      return ({
        id: n.id,
        type: (n.data as RFArchNodeData)?.nodeKind ?? "rectangle",
        position: n.position,
        data: {
          label: String((n.data as RFArchNodeData)?.label ?? ""),
          description: (n.data as RFArchNodeData)?.description,
          fillColor: (n.data as RFArchNodeData)?.fillColor,
          textColor: (n.data as RFArchNodeData)?.textColor,
          borderColor: (n.data as RFArchNodeData)?.borderColor,
          iconKey: (n.data as RFArchNodeData)?.iconKey,
          virtualOf: (n.data as RFArchNodeData)?.virtualOf,
        },
        width: resolvedWidth,
        height: resolvedHeight,
        rotation: (n.data as RFArchNodeData)?.rotation ?? 0,
        diagram: baseNodes.find((bn) => bn.id === n.id)?.diagram ?? { nodes: [], edges: [] },
      } satisfies DiagramNode);
    });

    const stack = drillStackRef.current;
    if (stack.length === 0) {
      const asDomainNodes = toDomainNodes(existing.nodes);
      const asDomainEdges: DiagramEdge[] = rfEdges.map((e) => {
        const d: RFArchEdgeData = (e.data ?? {}) as RFArchEdgeData;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: d.shape === "smoothstep" || d.shape === "step" || d.shape === "bezier" || d.shape === "straight"
            ? d.shape
            : (e.type === "smoothstep" || e.type === "step" || e.type === "bezier" ? (e.type as DiagramEdge["type"]) : "straight"),
          label: (() => {
            const text = String((d.label ?? e.label ?? "")).trim();
            if (!text) return undefined;
            const fontSize = Number(d.fontSize ?? 12);
            const color = d.labelColor;
            const background = d.labelBackground;
            return { text, fontSize, color, background };
          })(),
          arrowStart: Boolean((e as RFEdge).markerStart),
          arrowEnd: Boolean((e as RFEdge).markerEnd),
          strokeColor: d.strokeColor,
          strokeWidth: Number(d.strokeWidth ?? 2),
          dashed: Boolean(d.dashed),
          animated: Boolean(d.animated),
        };
      });
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
    const updatedNestedEdges: DiagramEdge[] = rfEdges.map((e) => {
      const d: RFArchEdgeData = (e.data ?? {}) as RFArchEdgeData;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: d.shape === "smoothstep" || d.shape === "step" || d.shape === "bezier" || d.shape === "straight"
          ? d.shape
          : (e.type === "smoothstep" || e.type === "step" || e.type === "bezier" ? (e.type as DiagramEdge["type"]) : "straight"),
        label: (() => {
          const text = String((d.label ?? e.label ?? "")).trim();
          if (!text) return undefined;
          const fontSize = Number(d.fontSize ?? 12);
          const color = d.labelColor;
          const background = d.labelBackground;
          return { text, fontSize, color, background };
        })(),
        arrowStart: Boolean((e as RFEdge).markerStart),
        arrowEnd: Boolean((e as RFEdge).markerEnd),
        strokeColor: d.strokeColor,
        strokeWidth: Number(d.strokeWidth ?? 2),
        dashed: Boolean(d.dashed),
        animated: Boolean(d.animated),
      };
    });
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

  // --- Virtual node creation dialog state ---
  type FlattenedNode = { nodeId: string; label: string; diagramId: string; pathIds: string[]; pathLabels: string[]; nodeType: DiagramNode["type"] };
  const [isVirtualDialogOpen, setIsVirtualDialogOpen] = React.useState<boolean>(false);
  const [virtualSearch, setVirtualSearch] = React.useState<string>("");
  const [virtualSelection, setVirtualSelection] = React.useState<FlattenedNode | null>(null);

  // --- Global search state ---
  const [globalSearch, setGlobalSearch] = React.useState<string>("");

  const flattenAllNodes = React.useCallback((): FlattenedNode[] => {
    const results: FlattenedNode[] = [];
    const diagramsEntries = Object.entries(diagrams);
    for (const [dId, d] of diagramsEntries) {
      const stack: Array<{ node: DiagramNode; pathIds: string[]; pathLabels: string[] }> = (d.nodes ?? []).map((n) => ({ node: n, pathIds: [], pathLabels: [] }));
      while (stack.length > 0) {
        const { node, pathIds, pathLabels } = stack.pop()!;
        results.push({ nodeId: node.id, label: node.data.label, diagramId: dId, pathIds: [...pathIds, node.id], pathLabels: [...pathLabels, node.data.label], nodeType: node.type });
        if (node.diagram?.nodes?.length) {
          for (const child of node.diagram.nodes) {
            stack.push({ node: child, pathIds: [...pathIds, node.id], pathLabels: [...pathLabels, node.data.label] });
          }
        }
      }
    }
    return results;
  }, [diagrams]);

  const allFlattened = React.useMemo(() => flattenAllNodes(), [flattenAllNodes]);
  const currentDomainNodeIds = React.useMemo(() => new Set((currentDomain.nodes ?? []).map((n) => n.id)), [currentDomain.nodes]);
  const filteredFlattened = React.useMemo(() => {
    const q = virtualSearch.trim().toLowerCase();
    const base = q ? allFlattened.filter((f) => f.label.toLowerCase().includes(q)) : allFlattened;
    // Filter out nodes that are already in the current diagram view
    return base.filter((f) => !currentDomainNodeIds.has(f.nodeId)).slice(0, 200);
  }, [allFlattened, virtualSearch, currentDomainNodeIds]);

  // Global search results (across all diagrams; don't exclude current domain)
  const globalResults = React.useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [] as FlattenedNode[];
    return allFlattened
      .filter((f) => f.label.toLowerCase().includes(q) || f.pathLabels.some((p) => p.toLowerCase().includes(q)))
      .slice(0, 200);
  }, [allFlattened, globalSearch]);

  const handleAddVirtualNode = () => {
    setIsVirtualDialogOpen(true);
    setVirtualSelection(null);
    setVirtualSearch("");
  };

  const confirmAddVirtualNode = () => {
    if (!diagram || !virtualSelection) return;
    const position = { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 };
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "virtual",
        position,
        width: 180,
        height: 80,
        data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId },
        diagram: { nodes: [], edges: [] },
      });
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: "virtual", position, width: 180, height: 80, data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId }, diagram: { nodes: [], edges: [] } }),
      ]);
    } else {
      const id = nanoid();
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: "virtual", position, width: 180, height: 80, data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId }, diagram: { nodes: [], edges: [] } }),
      ]);
      // persistence handled by autosave
    }
    setIsVirtualDialogOpen(false);
    setVirtualSelection(null);
  };

  // Find path to a node across diagrams; returns {diagramId, pathIds}
  const findNodeAcrossDiagrams = React.useCallback((targetId: string | undefined): { diagramId: string; pathIds: string[] } | null => {
    if (!targetId) return null;
    for (const [dId, d] of Object.entries(diagrams)) {
      const stack: Array<{ node: DiagramNode; path: string[] }> = (d.nodes ?? []).map((n) => ({ node: n, path: [n.id] }));
      while (stack.length > 0) {
        const { node, path } = stack.pop()!;
        if (node.id === targetId) return { diagramId: dId, pathIds: path };
        if (node.diagram?.nodes?.length) {
          for (const child of node.diagram.nodes) {
            stack.push({ node: child, path: [...path, child.id] });
          }
        }
      }
    }
    return null;
  }, [diagrams]);

  const onBack = () => {
    ensureSyncedThen(() => popDrill());
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
    const nodeData = node.data as Partial<RFArchNodeData>;
    const isVirtual = nodeData.nodeKind === "virtual" || Boolean(nodeData.virtualOf);
    if (isVirtual) {
      const target = findNodeAcrossDiagrams(nodeData.virtualOf);
      if (target) {
        ensureSyncedThen(() => {
          if (currentId !== target.diagramId) navigateTo(target.diagramId);
          // Open the target node's sub-diagram
          setDrillStack(target.pathIds);
        });
        return;
      }
    }
    ensureSyncedThen(() => pushDrill(node.id));
  }, [ensureSyncedThen, findNodeAcrossDiagrams, currentId, navigateTo, pushDrill, setDrillStack]);

  const onNodeClick = React.useCallback((_: React.MouseEvent, node: RFNode) => {
    const nodeData = node.data as Partial<RFArchNodeData>;
    const isVirtual = nodeData.nodeKind === "virtual" || Boolean(nodeData.virtualOf);
    if (!isVirtual) return;
    const target = findNodeAcrossDiagrams(nodeData.virtualOf);
    if (!target) return;
    ensureSyncedThen(() => {
      if (currentId !== target.diagramId) navigateTo(target.diagramId);
      setDrillStack(target.pathIds);
    });
  }, [ensureSyncedThen, findNodeAcrossDiagrams, currentId, navigateTo, setDrillStack]);

  const handleGoToSearchItem = React.useCallback((item: FlattenedNode) => {
    ensureSyncedThen(() => {
      if (currentId !== item.diagramId) navigateTo(item.diagramId);
      setDrillStack(item.pathIds);
      setPendingFocus({ diagramId: item.diagramId, containerPathIds: item.pathIds, focusNodeIds: [item.nodeId] });
    });
    setGlobalSearch("");
  }, [ensureSyncedThen, currentId, navigateTo, setDrillStack, setPendingFocus]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState<boolean>(false);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-2 border-b p-2">
        <Button size="sm" onClick={onAddNode}>Add node</Button>
        <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>Create node</Button>
        <Button size="sm" variant="outline" onClick={handleAddVirtualNode}>Add virtual node</Button>
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
      {/* Global search below the action buttons */}
      <div className="border-b p-2 gap-2 flex flex-col">
        <div className="relative max-w-xl">
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            placeholder="Search nodes across all diagrams..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && globalResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full border rounded bg-background max-h-64 overflow-auto shadow">
              <ul>
                {globalResults.map((item) => {
                  const isVirtual = item.nodeType === "virtual";
                  return (
                    <li key={`${item.diagramId}:${item.nodeId}`}>
                      <button
                        className="w-full px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => handleGoToSearchItem(item)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{item.pathLabels.join(" › ")} {item.pathLabels.length ? "(path)" : ""}</div>
                          </div>
                          <div className="shrink-0 text-muted-foreground">
                            {isVirtual ? (
                              <LinkIcon className="h-3.5 w-3.5" />
                            ) : (
                              <Square className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="border-b p-2 gap-2 flex">
        {Object.values(nodeTemplates).map((tpl) => {
          const def = getIconByKey(tpl.data.iconKey);
          const I = def?.Icon;
          return (
            <Button key={tpl.id} size="sm" variant="outline" onClick={() => setPendingSpawn({ templateId: tpl.id })} title={tpl.name} className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  tpl.type === "ellipse" ? "rounded-full" : "rounded-sm",
                  "border w-3.5 h-3.5",
                  typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-") ? tpl.data.fillColor : "",
                  typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-") ? tpl.data.borderColor : "",
                )}
                style={{
                  backgroundColor:
                    typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-")
                      ? undefined
                      : (tpl.data.fillColor as string | undefined),
                  borderColor:
                    typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-")
                      ? undefined
                      : (tpl.data.borderColor as string | undefined),
                }}
              ></span>
              {I ? <I className="h-4 w-4" /> : null}
              <span className="hidden sm:inline text-xs">{tpl.name}</span>
            </Button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          connectionMode={ConnectionMode.Loose}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={{ arch: ArchEdge }}
          nodesConnectable
          onSelectionChange={(sel) => {
            const e = (sel?.edges ?? [])[0] as RFEdge | undefined;
            setSelectedEdge(e ?? null);
            const n = (sel?.nodes ?? [])[0];
            setSelectedNodeId(n?.id ?? null);
          }}
          fitView
        >
          <FocusIntentHandler />
          <Background gap={16} />
          <MiniMap />
          <Controls />
        </ReactFlow>
        <CreateNodeTemplateDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
        <NodeControls
          selectedNode={(() => {
            const n = selectedNodeId ? nodes.find((nn) => nn.id === selectedNodeId) ?? null : null;
            const nodeData = (n?.data ?? {}) as Partial<RFArchNodeData>;
            const isVirtual = n ? (nodeData.nodeKind === "virtual" || Boolean(nodeData.virtualOf)) : false;
            return isVirtual ? null : n;
          })()}
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
      {isVirtualDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-[600px] max-w-[90vw] rounded-md border bg-background shadow-lg">
            <div className="border-b px-3 py-2 text-sm font-medium">Add virtual node</div>
            <div className="p-3 space-y-3">
              <input
                className="w-full rounded border px-2 py-1 bg-transparent"
                placeholder="Search nodes by label..."
                value={virtualSearch}
                onChange={(e) => setVirtualSearch(e.target.value)}
              />
              <div className="max-h-64 overflow-auto border rounded">
                <ul>
                  {filteredFlattened.map((item) => {
                    const isSelected = virtualSelection?.nodeId === item.nodeId && virtualSelection.diagramId === item.diagramId;
                    return (
                      <li key={`${item.diagramId}:${item.nodeId}`}>
                        <button
                          className={`w-full text-left px-3 py-2 text-sm ${isSelected ? "bg-accent" : "hover:bg-muted"}`}
                          onClick={() => setVirtualSelection(item)}
                        >
                          <div className="font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.pathLabels.join(" › ")} {item.pathLabels.length ? "(path)" : ""}</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsVirtualDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!virtualSelection} onClick={confirmAddVirtualNode}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


