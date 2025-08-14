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
  useReactFlow as useRFInstance,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode, SubDiagram } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, Upload, CornerUpLeft, Link as LinkIcon, Square } from "lucide-react";
import { ArchNode } from "@/components/diagram/nodes/ArchNode";
import { NodeControls } from "./NodeControls";
import { EdgeControls } from "@/components/diagram/edges/EdgeControls";
import { nanoid } from "nanoid";
import { FocusIntentHandler } from "./FocusIntentHandler";
import { ArchEdge } from "@/components/diagram/edges/ArchEdge";

type RFArchEdgeData = {
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
    virtualOf: n.data?.virtualOf,
  };
  if (opts?.onLabelCommit) {
    baseData.onLabelCommit = (next: string) => opts.onLabelCommit!(n.id, next);
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
  const { diagrams, currentId, setNodesEdges, addNode, navigateTo, drillStack, pushDrill, popDrill, setDrillStack, setPendingFocus } = useAppStore();
  const diagram: Diagram | undefined = diagrams[currentId];

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
          markerEnd: { type: MarkerType.ArrowClosed },
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
        virtualOf: (n.data as any)?.virtualOf,
      },
      width: (n as any).style?.width ?? (n.data as any)?.width ?? 180,
      height: (n as any).style?.height ?? (n.data as any)?.height ?? 80,
      rotation: (n.data as any)?.rotation ?? 0,
      diagram: baseNodes.find((bn) => bn.id === n.id)?.diagram ?? { nodes: [], edges: [] },
    } satisfies DiagramNode));

    const stack = drillStackRef.current;
    if (stack.length === 0) {
      const asDomainNodes = toDomainNodes(existing.nodes);
      const asDomainEdges: DiagramEdge[] = rfEdges.map((e) => {
        const d = (e.data ?? {}) as RFArchEdgeData;
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
        arrowStart: Boolean((e as any).markerStart),
        arrowEnd: Boolean((e as any).markerEnd),
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
      const d = (e.data ?? {}) as RFArchEdgeData;
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
        arrowStart: Boolean((e as any).markerStart),
        arrowEnd: Boolean((e as any).markerEnd),
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
    const isVirtual = (node.data as any)?.nodeKind === "virtual" || Boolean((node.data as any)?.virtualOf);
    if (isVirtual) {
      const target = findNodeAcrossDiagrams((node.data as any)?.virtualOf);
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
    const isVirtual = (node.data as any)?.nodeKind === "virtual" || Boolean((node.data as any)?.virtualOf);
    if (!isVirtual) return;
    const target = findNodeAcrossDiagrams((node.data as any)?.virtualOf);
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

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-2 border-b p-2">
        <Button size="sm" onClick={onAddNode}>Add node</Button>
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
      <div className="border-b p-2">
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
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
        <NodeControls
          selectedNode={(() => {
            const n = selectedNodeId ? nodes.find((nn) => nn.id === selectedNodeId) ?? null : null;
            const isVirtual = n ? ((n.data as any)?.nodeKind === "virtual" || Boolean((n.data as any)?.virtualOf)) : false;
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


