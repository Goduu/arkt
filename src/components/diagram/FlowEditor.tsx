"use client";

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
import type { AppStateSnapshot, Diagram, DiagramEdge, DiagramNode, RFArchEdgeData, RFArchNodeData, SubDiagram, DiagramPolyline, DiagramPolylinePoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArchNode } from "@/components/diagram/nodes/ArchNode";
import { ArchTextNode } from "@/components/diagram/nodes/ArchTextNode";
import { ArchPolylineNode } from "@/components/diagram/nodes/ArchPolylineNode";
import { NodeControls } from "./node-controls/NodeControls";
import { EdgeControls } from "@/components/diagram/edges/EdgeControls";
import { nanoid } from "nanoid";
import { FocusIntentHandler } from "./FocusIntentHandler";
import { ArchEdge } from "@/components/diagram/edges/ArchEdge";
import { CreateNodeTemplateDialog } from "./CreateNodeTemplateDialog";
import { TemplatesManagerDialog } from "./TemplatesManagerDialog";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddVirtualDialog } from "./AddVirtualDialog";


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
    templateId: n.data?.templateId,
  };
  if (opts?.onLabelCommit) {
    baseData.onLabelCommit = (next: string) => opts.onLabelCommit && opts.onLabelCommit(n.id, next);
  }
  const isText = n.type === "text";
  const isSquare = n.type === "square";
  const isLine = n.type === "line";
  return {
    id: n.id,
    position: n.position,
    data: baseData,
    type: isText ? "archTextNode" : isLine ? "archLineNode" : "archNode",
    style: isText ? {} : { width: n.width ?? 180, height: n.height ?? 80 },
  } satisfies RFNode;
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
  const { diagrams, currentId, setNodesEdges, addNode, navigateTo, drillStack, pushDrill, popDrill, setDrillStack, setPendingFocus, pendingSpawn, setPendingSpawn, nodeTemplates, pendingCommand, setPendingCommand } = useAppStore();
  const diagram: Diagram | undefined = diagrams[currentId];
  const rf = useReactFlow();

  // Drill stack is now global in store

  const isNestedView = drillStack.length > 0;

  const getNestedDiagram = useCallback((sourceNodes: DiagramNode[], stack: string[]): SubDiagram => {
    if (stack.length === 0) return { nodes: sourceNodes, edges: diagram?.edges ?? [], lines: diagram?.lines ?? [] };
    const [head, ...rest] = stack;
    const found = sourceNodes.find((n) => n.id === head);
    if (!found) return { nodes: [], edges: [], lines: [] };
    if (rest.length === 0) return found.diagram ?? { nodes: [], edges: [], lines: [] };
    return getNestedDiagram(found.diagram?.nodes ?? [], rest);
  }, [diagram?.edges]);

  const currentDomain = useMemo(() => {
    if (!diagram) return { nodes: [] as DiagramNode[], edges: [] as DiagramEdge[], lines: [] as DiagramPolyline[] };
    if (drillStack.length === 0) return { nodes: diagram.nodes, edges: diagram.edges, lines: diagram.lines ?? [] };
    return getNestedDiagram(diagram.nodes, drillStack);
  }, [diagram, drillStack, getNestedDiagram]);

  // Converter for stored polyline to RF node (includes onUpdatePoints)
  const polylineToRFNode = (id: string, absPoints: { x: number; y: number }[], style?: { strokeColor?: string; strokeWidth?: number }): RFNode => {
    const minX = Math.min(...absPoints.map((p) => p.x));
    const minY = Math.min(...absPoints.map((p) => p.y));
    const maxX = Math.max(...absPoints.map((p) => p.x));
    const maxY = Math.max(...absPoints.map((p) => p.y));
    const PAD = 8;
    const width = Math.max(1, (maxX - minX) + 2 * PAD);
    const height = Math.max(1, (maxY - minY) + 2 * PAD);
    const rel = absPoints.map((p) => ({ x: (p.x - minX) + PAD, y: (p.y - minY) + PAD }));
    return {
      id: `poly:${id}`,
      type: 'archPolylineNode' as unknown as RFNode['type'],
      position: { x: minX - PAD, y: minY - PAD },
      data: {
        lineId: id,
        points: rel,
        strokeColor: style?.strokeColor ?? '#4b5563',
        strokeWidth: style?.strokeWidth ?? 2,
        padding: PAD,
        onUpdatePoints: (lid: string, nextRel: { x: number; y: number }[]) => {
          setNodes((prev) => prev.map((n) => n.id === `poly:${lid}` ? { ...n, data: { ...(n.data as object), points: nextRel } } as RFNode : n));
        },
      },
      style: { width, height },
    } as unknown as RFNode;
  };

  const initialNodes = useMemo(() => {
    const base = (currentDomain.nodes ?? []).flatMap((n) => {
      if ((n as DiagramNode).type === 'polyline') {
        const pdata = (n.data as any)?.polyline as { points?: { x: number; y: number }[]; strokeColor?: string; strokeWidth?: number; dashed?: boolean } | undefined;
        const pts = Array.isArray(pdata?.points) ? (pdata?.points as { x: number; y: number }[]) : [];
        if (pts.length >= 2) {
          const abs = pts.map((p) => ({ x: p.x + n.position.x, y: p.y + n.position.y }));
          return [polylineToRFNode(n.id, abs, { strokeColor: pdata?.strokeColor, strokeWidth: pdata?.strokeWidth })];
        }
        return [];
      }
      return [toRFNode(n, isNestedView ? {
        onLabelCommit: (id, next) => {
          setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn)));
        },
      } : undefined)];
    });
    const polyNodeIds = new Set((currentDomain.nodes ?? []).filter((n) => n.type === 'polyline').map((n) => n.id));
    const legacy = (currentDomain.lines ?? [])
      .filter((l) => !polyNodeIds.has(l.id))
      .map((l) => polylineToRFNode(l.id, l.points, { strokeColor: l.strokeColor, strokeWidth: l.strokeWidth }));
    return [...base, ...legacy];
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [diagram?.id, drillStack]);
  const initialEdges = useMemo(() => (currentDomain.edges ?? []).map(toRFEdge), [currentDomain.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState<RFEdge | null>(null);
  const [isDrawingLine, setIsDrawingLine] = useState<boolean>(false);
  const [draftPoints, setDraftPoints] = useState<DiagramPolylinePoint[]>([]);
  const [viewport, setViewport] = useState<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 1 });
  const viewportRef = useRef<{ x: number; y: number; zoom: number }>(viewport);
  useEffect(() => { viewportRef.current = viewport; }, [viewport]);
  const viewportRafRef = useRef<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const connectFromHandle = useRef<"source" | "target" | null>(null);
  const getSpawnPosition = useCallback((nodeWidth: number, nodeHeight: number) => {
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
  useEffect(() => {
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
          templateId: pendingSpawn.templateId,
        },
        diagram: { nodes: [], edges: [], lines: [] },
      });
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: tpl.type, position, width: nodeWidth, height: nodeHeight, rotation: tpl.rotation ?? 0, data: { label: tpl.data.label ?? "Node", fillColor: tpl.data.fillColor, textColor: tpl.data.textColor, borderColor: tpl.data.borderColor, iconKey: tpl.data.iconKey, templateId: pendingSpawn.templateId }, diagram: { nodes: [], edges: [], lines: [] } }),
      ]);
    } else {
      const id = nanoid();
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: tpl.type, position, width: nodeWidth, height: nodeHeight, rotation: tpl.rotation ?? 0, data: { label: tpl.data.label ?? "Node", fillColor: tpl.data.fillColor, textColor: tpl.data.textColor, borderColor: tpl.data.borderColor, iconKey: tpl.data.iconKey, templateId: pendingSpawn.templateId }, diagram: { nodes: [], edges: [], lines: [] } }),
      ]);
      // persistence handled by autosave
    }
    setPendingSpawn(null);
  }, [pendingSpawn, nodeTemplates, diagram, drillStack.length, addNode, setNodes, setPendingSpawn, getSpawnPosition]);

  useEffect(() => {
    const base = (currentDomain.nodes ?? []).flatMap((n) => {
      if ((n as DiagramNode).type === 'polyline') {
        const pdata = (n.data as any)?.polyline as { points?: { x: number; y: number }[]; strokeColor?: string; strokeWidth?: number; dashed?: boolean } | undefined;
        const pts = Array.isArray(pdata?.points) ? (pdata?.points as { x: number; y: number }[]) : [];
        if (pts.length >= 2) {
          const abs = pts.map((p) => ({ x: p.x + n.position.x, y: p.y + n.position.y }));
          return [polylineToRFNode(n.id, abs, { strokeColor: pdata?.strokeColor, strokeWidth: pdata?.strokeWidth })];
        }
        return [];
      }
      return [toRFNode(n, isNestedView ? {
        onLabelCommit: (id, next) => setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn))),
      } : undefined)];
    });
    const polyNodeIds = new Set((currentDomain.nodes ?? []).filter((n) => n.type === 'polyline').map((n) => n.id));
    const legacy = (currentDomain.lines ?? [])
      .filter((l) => !polyNodeIds.has(l.id))
      .map((l) => polylineToRFNode(l.id, l.points, { strokeColor: l.strokeColor, strokeWidth: l.strokeWidth }));
    setNodes([...base, ...legacy]);
    setEdges((currentDomain.edges ?? []).map(toRFEdge));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram?.id, drillStack]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
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

  const onConnectStart: OnConnectStart = useCallback((_, params) => {
    connectFromHandle.current = params.handleType ?? null;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    // no-op; reset happens in onConnect
  }, []);

  // Refs to persist latest graph state on unmount/navigation
  const nodesRef = useRef<RFNode[]>(nodes);
  const edgesRef = useRef<RFEdge[]>(edges);
  const diagramIdRef = useRef<string | undefined>(diagram?.id);
  const drillStackRef = useRef<string[]>(drillStack);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { diagramIdRef.current = diagram?.id; }, [diagram?.id]);
  useEffect(() => { drillStackRef.current = drillStack; }, [drillStack]);

  const syncToStore = useCallback(() => {
    const id = diagramIdRef.current;
    if (!id) return;
    const currentStore = useAppStore.getState();
    const existing = currentStore.diagrams[id];
    if (!existing) return;

    const rfNodes = nodesRef.current;
    const rfEdges = edgesRef.current;

    const toDomainNodes = (baseNodes: DiagramNode[]) => rfNodes.map((n) => {
      // Persist polyline as a node type with relative points
      if (n.type === 'archPolylineNode') {
        const d = (n.data ?? {}) as unknown as { lineId?: string; points?: { x: number; y: number }[]; strokeColor?: string; strokeWidth?: number; dashed?: boolean; padding?: number };
        const styleWidth = (n as RFNode).style?.width;
        const styleHeight = (n as RFNode).style?.height;
        const resolvedWidth = typeof styleWidth === 'number' ? styleWidth : 180;
        const resolvedHeight = typeof styleHeight === 'number' ? styleHeight : 80;
        const nodeId = String(d.lineId ?? n.id.replace(/^poly:/, ''));
        const existingDiagram = baseNodes.find((bn) => bn.id === nodeId)?.diagram ?? { nodes: [], edges: [], lines: [] };
        const polyNode: DiagramNode = {
          id: nodeId,
          type: 'polyline',
          position: n.position,
          width: resolvedWidth,
          height: resolvedHeight,
          rotation: 0,
          data: {
            label: '',
            polyline: {
              points: (d.points ?? []),
              strokeColor: d.strokeColor,
              strokeWidth: typeof d.strokeWidth === 'number' ? d.strokeWidth : 2,
              dashed: d.dashed,
              padding: typeof d.padding === 'number' ? d.padding : 8,
            },
          },
          diagram: existingDiagram,
        };
        return polyNode;
      }
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
          templateId: (n.data as RFArchNodeData)?.templateId,
        },
        width: resolvedWidth,
        height: resolvedHeight,
        rotation: (n.data as RFArchNodeData)?.rotation ?? 0,
        diagram: baseNodes.find((bn) => bn.id === n.id)?.diagram ?? { nodes: [], edges: [], lines: [] },
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
      // Persist polylines as nodes only; clear legacy lines array
      setNodesEdges(id, asDomainNodes, asDomainEdges, []);
      return;
    }

    const replaceNested = (nodes: DiagramNode[], path: string[], replacement: SubDiagram): DiagramNode[] => {
      if (path.length === 0) return replacement.nodes;
      const [head, ...rest] = path;
      return nodes.map((node) =>
        node.id === head
          ? { ...node, diagram: rest.length === 0 ? replacement : { nodes: replaceNested(node.diagram?.nodes ?? [], rest, replacement), edges: node.diagram?.edges ?? [], lines: node.diagram?.lines ?? [] } }
          : node
      );
    };
    const baseNested = (() => {
      let sub: SubDiagram = { nodes: existing.nodes as DiagramNode[], edges: existing.edges as DiagramEdge[], lines: existing.lines ?? [] };
      for (const nid of stack) {
        const found = (sub.nodes ?? []).find((n) => n.id === nid);
        if (!found) return { nodes: [], edges: [], lines: [] } as SubDiagram;
        sub = found.diagram ?? { nodes: [], edges: [], lines: [] };
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
    // Persist polylines as nodes only in nested sub-diagrams
    const updatedTop = replaceNested(existing.nodes, stack, { nodes: updatedNestedNodes, edges: updatedNestedEdges, lines: [] });
    setNodesEdges(id, updatedTop, existing.edges, existing.lines);
  }, [setNodesEdges]);

  // Debounced autosave when nodes/edges change
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      syncToStore();
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, syncToStore]);

  // Persist on unmount (e.g., when navigating via breadcrumb)
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      syncToStore();
    };
  }, [syncToStore]);

  const onAddNode = () => {
    if (!diagram) return;
    const nodeWidth = 180;
    const nodeHeight = 80;
    const position = getSpawnPosition(nodeWidth, nodeHeight);
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "rectangle",
        position,
        width: nodeWidth,
        height: nodeHeight,
        data: { label: "Node" },
        diagram: { nodes: [], edges: [], lines: [] },
      });
      setNodes((prev) => [...prev, toRFNode({ id, type: "rectangle", position, data: { label: "Node" }, width: nodeWidth, height: nodeHeight, diagram: { nodes: [], edges: [], lines: [] } })]);
      return;
    }
    const id = nanoid();
    setNodes((prev) => [...prev, toRFNode({ id, type: "rectangle", position, data: { label: "Node" }, width: nodeWidth, height: nodeHeight, diagram: { nodes: [], edges: [], lines: [] } })]);
    // persistence handled by autosave
  };

  const onAddSquareNode = () => {
    if (!diagram) return;
    const size = 140;
    const position = getSpawnPosition(size, size);
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "square",
        position,
        width: size,
        height: size,
        data: { label: "Square" },
        diagram: { nodes: [], edges: [], lines: [] },
      });
      setNodes((prev) => [...prev, toRFNode({ id, type: "square", position, data: { label: "Square" }, width: size, height: size, diagram: { nodes: [], edges: [], lines: [] } })]);
      return;
    }
    const id = nanoid();
    setNodes((prev) => [...prev, toRFNode({ id, type: "square", position, data: { label: "Square" }, width: size, height: size, diagram: { nodes: [], edges: [], lines: [] } })]);
    // persistence handled by autosave
  };

  const beginLineDrawing = useCallback(() => {
    setIsDrawingLine(true);
    setDraftPoints([]);
  }, []);

  const onAddTextNode = () => {
    if (!diagram) return;
    const position = getSpawnPosition(60, 24);
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "text",
        position,
        data: { label: "Text" },
        diagram: { nodes: [], edges: [], lines: [] },
      });
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: "text", position, data: { label: "Text" }, diagram: { nodes: [], edges: [], lines: [] } }),
      ]);
      return;
    }
    const id = nanoid();
    setNodes((prev) => [
      ...prev,
      toRFNode({ id, type: "text", position, data: { label: "Text" }, diagram: { nodes: [], edges: [], lines: [] } }),
    ]);
    // persistence handled by autosave
  };

  // --- Virtual node creation dialog state ---
  type FlattenedNode = { nodeId: string; label: string; diagramId: string; pathIds: string[]; pathLabels: string[]; nodeType: DiagramNode["type"] };
  const [isVirtualDialogOpen, setIsVirtualDialogOpen] = useState<boolean>(false);


  const handleAddVirtualNode = (virtualSelection: FlattenedNode | null) => {
    if (!diagram || !virtualSelection || !virtualSelection) return;
    const position = { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 };
    if (drillStack.length === 0) {
      const id = addNode(diagram.id, {
        type: "virtual",
        position,
        width: 180,
        height: 80,
        data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId },
        diagram: { nodes: [], edges: [], lines: [] },
      });
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: "virtual", position, width: 180, height: 80, data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId }, diagram: { nodes: [], edges: [], lines: [] } }),
      ]);
    } else {
      const id = nanoid();
      setNodes((prev) => [
        ...prev,
        toRFNode({ id, type: "virtual", position, width: 180, height: 80, data: { label: virtualSelection.label, virtualOf: virtualSelection.nodeId }, diagram: { nodes: [], edges: [], lines: [] } }),
      ]);
      // persistence handled by autosave
    }
    setIsVirtualDialogOpen(false);
  };

  // Find path to a node across diagrams; returns {diagramId, pathIds}
  const findNodeAcrossDiagrams = useCallback((targetId: string | undefined): { diagramId: string; pathIds: string[] } | null => {
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

  const onExport = useCallback(() => {
    // Export full application snapshot: diagrams + rootId + templates
    const snapshot: AppStateSnapshot = useAppStore.getState().exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archkt-snapshot-${diagram?.name ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagram?.name]);

  const nodeTypes = useMemo(() => ({ archNode: ArchNode, archTextNode: ArchTextNode, archPolylineNode: ArchPolylineNode }), []);
  const edgeTypes = useMemo(() => ({ arch: ArchEdge }), []);
  const ensureSyncedThen = useCallback((after: () => void) => {
    // Persist current visual state to store before navigation
    syncToStore();
    // Give store a microtask to update
    setTimeout(after, 0);
  }, [syncToStore]);

  const onNodeDoubleClick = useCallback((_: MouseEvent, node: RFNode) => {
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

  const onNodeClick = useCallback((_: MouseEvent, node: RFNode) => {
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

  // handleGoToSearchItem now lives inside GlobalSearch

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isTemplatesManagerOpen, setIsTemplatesManagerOpen] = useState<boolean>(false);

  // Handle global pending commands (from sidebar Add menu)
  useEffect(() => {
    if (!pendingCommand) return;
    const t = pendingCommand.type as string;
    if (t === "addText") onAddTextNode();
    else if (t === "addNode") onAddNode();
    else if (t === "addSquare") onAddSquareNode();
    else if (t === "addLine") beginLineDrawing();
    else if (t === "addVirtual") setIsVirtualDialogOpen(true);
    else if (t === "openCreateTemplate") setIsCreateDialogOpen(true);
    else if (t === "openTemplates") setIsTemplatesManagerOpen(true);
    else if (t === "refreshTemplates") {
      // Rebuild RF state from latest store for current domain, including polylines from nodes and legacy lines
      const base = (currentDomain.nodes ?? []).flatMap((n) => {
        if ((n as DiagramNode).type === 'polyline') {
          const pdata = (n.data as any)?.polyline as { points?: { x: number; y: number }[]; strokeColor?: string; strokeWidth?: number; dashed?: boolean } | undefined;
          const pts = Array.isArray(pdata?.points) ? (pdata?.points as { x: number; y: number }[]) : [];
          if (pts.length >= 2) {
            const abs = pts.map((p) => ({ x: p.x + n.position.x, y: p.y + n.position.y }));
            return [polylineToRFNode(n.id, abs, { strokeColor: pdata?.strokeColor, strokeWidth: pdata?.strokeWidth })];
          }
          return [];
        }
        return [toRFNode(n, isNestedView ? {
          onLabelCommit: (id, next) => setNodes((prev) => prev.map((rn) => (rn.id === id ? { ...rn, data: { ...rn.data, label: next } } : rn))),
        } : undefined)];
      });
      const polyNodeIds = new Set((currentDomain.nodes ?? []).filter((n) => n.type === 'polyline').map((n) => n.id));
      const legacy = (currentDomain.lines ?? [])
        .filter((l) => !polyNodeIds.has(l.id))
        .map((l) => polylineToRFNode(l.id, l.points, { strokeColor: l.strokeColor, strokeWidth: l.strokeWidth }));
      setNodes([...base, ...legacy]);
      setEdges((currentDomain.edges ?? []).map(toRFEdge));
    }
    else if (t === "save") syncToStore();
    else if (t === "export") ensureSyncedThen(onExport);
    else if (t === "import") {
      const payload = (pendingCommand as { type: "import"; data: unknown }).data as unknown;
      const maybeSnapshot = payload as Partial<AppStateSnapshot> | null;
      if (maybeSnapshot && typeof maybeSnapshot === "object" && maybeSnapshot !== null && "diagrams" in maybeSnapshot && "rootId" in maybeSnapshot) {
        useAppStore.getState().importSnapshot(maybeSnapshot as AppStateSnapshot);
        // After importing, rebuild RF state from the new store
        setTimeout(() => {
          const nextStore = useAppStore.getState();
          const d = nextStore.diagrams[nextStore.currentId];
          const domain = drillStackRef.current.length === 0 ? { nodes: d.nodes, edges: d.edges, lines: d.lines ?? [] } : (() => {
            // Reuse getNestedDiagram logic with current drill stack
            const sub = ((): SubDiagram => {
              let s: SubDiagram = { nodes: d.nodes, edges: d.edges, lines: d.lines ?? [] };
              for (const nid of drillStackRef.current) {
                const found = (s.nodes ?? []).find((n) => n.id === nid);
                if (!found) return { nodes: [], edges: [], lines: [] };
                s = found.diagram ?? { nodes: [], edges: [], lines: [] };
              }
              return s;
            })();
            return sub;
          })();
          const base = (domain.nodes ?? []).flatMap((n) => {
            if ((n as DiagramNode).type === 'polyline') {
              const pdata = (n.data as any)?.polyline as { points?: { x: number; y: number }[]; strokeColor?: string; strokeWidth?: number; dashed?: boolean } | undefined;
              const pts = Array.isArray(pdata?.points) ? (pdata?.points as { x: number; y: number }[]) : [];
              if (pts.length >= 2) {
                const abs = pts.map((p) => ({ x: p.x + n.position.x, y: p.y + n.position.y }));
                return [polylineToRFNode(n.id, abs, { strokeColor: pdata?.strokeColor, strokeWidth: pdata?.strokeWidth })];
              }
              return [];
            }
            return [toRFNode(n)];
          });
          const polyNodeIds = new Set((domain.nodes ?? []).filter((n) => n.type === 'polyline').map((n) => n.id));
          const legacy = (domain.lines ?? [])
            .filter((l) => !polyNodeIds.has(l.id))
            .map((l) => polylineToRFNode(l.id, l.points, { strokeColor: l.strokeColor, strokeWidth: l.strokeWidth }));
          setNodes([...base, ...legacy]);
          setEdges((domain.edges ?? []).map(toRFEdge));
        }, 0);
      } else {
        const simple = payload as { nodes?: RFNode[]; edges?: RFEdge[] } | null;
        if (simple && Array.isArray(simple.nodes) && Array.isArray(simple.edges)) {
          setNodes(simple.nodes);
          setEdges(simple.edges);
          setTimeout(syncToStore, 0);
        }
      }
    }
    else if (t === "back") onBack();
    setPendingCommand(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCommand]);

  const screenToFlow = useCallback((x: number, y: number) => {
    const hasConverter = typeof (rf as unknown as { screenToFlowPosition?: (p: { x: number; y: number }) => { x: number; y: number } }).screenToFlowPosition === 'function';
    if (hasConverter) {
      return (rf as unknown as { screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number } }).screenToFlowPosition({ x, y });
    }
    const vp = (rf as unknown as { getViewport: () => { x: number; y: number; zoom: number } }).getViewport();
    return { x: (x - vp.x) / vp.zoom, y: (y - vp.y) / vp.zoom };
  }, [rf]);

  useEffect(() => {
    try {
      const vp = (rf as unknown as { getViewport: () => { x: number; y: number; zoom: number } }).getViewport();
      setViewport(vp);
      viewportRef.current = vp;
    } catch {
      // ignore
    }
  }, [rf]);

  // clear dragging on mouse up anywhere
  useEffect(() => {
    const up = () => {
      // setDraggingPoint(null); // Removed as per new logic
      // setDraggingLine(null); // Removed as per new logic
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isDrawingLine) return;
      if (e.key === 'Escape') {
        setIsDrawingLine(false);
        setDraftPoints([]);
      } else if (e.key === 'Enter') {
        if (draftPoints.length >= 3) {
          const fixedPoints = draftPoints.slice(0, -1);
          const newLine: DiagramPolyline = { id: nanoid(), points: fixedPoints, strokeColor: '#4b5563', strokeWidth: 2 };
          setNodes((prev) => [
            ...prev,
            createPolylineRFNode(newLine.id, fixedPoints, { strokeColor: '#4b5563', strokeWidth: 2 })
          ]);
          setTimeout(syncToStore, 0);
        }
        setIsDrawingLine(false);
        setDraftPoints([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDrawingLine, draftPoints]);

  const createPolylineRFNode = useCallback((id: string, absPoints: { x: number; y: number }[], style?: { strokeColor?: string; strokeWidth?: number }): RFNode => {
    const minX = Math.min(...absPoints.map((p) => p.x));
    const minY = Math.min(...absPoints.map((p) => p.y));
    const maxX = Math.max(...absPoints.map((p) => p.x));
    const maxY = Math.max(...absPoints.map((p) => p.y));
    const PAD = 8; // ensure handles are fully visible inside the node box
    const width = Math.max(1, (maxX - minX) + 2 * PAD);
    const height = Math.max(1, (maxY - minY) + 2 * PAD);
    const rel = absPoints.map((p) => ({ x: (p.x - minX) + PAD, y: (p.y - minY) + PAD }));
    type RelPoint = { x: number; y: number };
    const rfNode: RFNode = {
      id: `poly:${id}`,
      type: 'archPolylineNode' as unknown as RFNode['type'],
      position: { x: minX - PAD, y: minY - PAD },
      data: {
        lineId: id,
        points: rel,
        strokeColor: style?.strokeColor ?? '#4b5563',
        strokeWidth: style?.strokeWidth ?? 2,
        padding: PAD,
        onUpdatePoints: (lid: string, nextRel: RelPoint[]) => {
          setNodes((prev) => prev.map((n) => n.id === `poly:${lid}` ? { ...n, data: { ...(n.data as object), points: nextRel } } as RFNode : n));
        },
      },
      style: { width, height },
    } as unknown as RFNode;
    return rfNode;
  }, [setNodes]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Global search below the action buttons */}
      <GlobalSearch ensureSyncedThen={ensureSyncedThen} />
      <div className="flex-1 min-h-0">
        <ReactFlow
          className={cn(isDrawingLine ? "cursor-crosshair-global" : undefined)}
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
          edgeTypes={edgeTypes}
          nodesConnectable
          nodesDraggable={!isDrawingLine}
          onSelectionChange={(sel) => {
            const e = (sel?.edges ?? [])[0] as RFEdge | undefined;
            setSelectedEdge(e ?? null);
            const n = (sel?.nodes ?? [])[0];
            setSelectedNodeId(n?.id ?? null);
          }}
          fitView
          onMove={(_, vp) => {
            viewportRef.current = vp;
            if (viewportRafRef.current == null) {
              viewportRafRef.current = requestAnimationFrame(() => {
                viewportRafRef.current = null;
                setViewport(viewportRef.current);
              });
            }
          }}
          onMoveEnd={(_, vp) => {
            if (viewportRafRef.current != null) {
              cancelAnimationFrame(viewportRafRef.current);
              viewportRafRef.current = null;
            }
            setViewport(vp);
          }}
          onMouseMove={(e) => {
            const p = screenToFlow(e.clientX, e.clientY);
            // if (draggingPoint) { // Removed as per new logic
            //   setLines((prev) => prev.map((l) => { // Removed as per new logic
            //     if (l.id !== draggingPoint.lineId) return l; // Removed as per new logic
            //     const pts = l.points.slice(); // Removed as per new logic
            //     pts[draggingPoint.index] = p; // Removed as per new logic
            //     return { ...l, points: pts }; // Removed as per new logic
            //   })); // Removed as per new logic
            //   return; // Removed as per new logic
            // } // Removed as per new logic
            // if (draggingLine) { // Removed as per new logic
            //   const dx = p.x - draggingLine.originMouse.x; // Removed as per new logic
            //   const dy = p.y - draggingLine.originMouse.y; // Removed as per new logic
            //   setLines((prev) => prev.map((l) => { // Removed as per new logic
            //     if (l.id !== draggingLine.lineId) return l; // Removed as per new logic
            //     const moved = draggingLine.originPoints.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })); // Removed as per new logic
            //     return { ...l, points: moved }; // Removed as per new logic
            //   })); // Removed as per new logic
            //   return; // Removed as per new logic
            // } // Removed as per new logic
            if (!isDrawingLine || draftPoints.length === 0) return;
            setDraftPoints((prev) => prev.length ? [...prev.slice(0, -1), p] : prev);
          }}
          onClick={(e) => {
            const p = screenToFlow(e.clientX, e.clientY);
            if (isDrawingLine) {
              if (draftPoints.length === 0) {
                setDraftPoints([p, p]);
              } else {
                setDraftPoints((prev) => [...prev, p]);
              }
            }
          }}
          onDoubleClick={(e) => {
            if (!isDrawingLine) return;
            e.stopPropagation();
            if (draftPoints.length >= 3) {
              const fixedPoints = draftPoints.slice(0, -1);
              const newLineId = nanoid();
              const node = createPolylineRFNode(newLineId, fixedPoints, { strokeColor: '#4b5563', strokeWidth: 2 });
              setNodes((prev) => [...prev, node]);
              setTimeout(syncToStore, 0);
            }
            setIsDrawingLine(false);
            setDraftPoints([]);
          }}
        >
          <FocusIntentHandler />
          <Background gap={16} />
          <MiniMap />
          <Controls />
          {/* SVG overlay for draft line only */}
          <svg className={cn("absolute inset-0 z-40", "pointer-events-none")} width="100%" height="100%">
            <g transform={`matrix(${viewport.zoom},0,0,${viewport.zoom},${viewport.x},${viewport.y})`}>
              {isDrawingLine && draftPoints.length >= 2 && (
                <polyline
                  points={draftPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </g>
          </svg>
        </ReactFlow>
        <CreateNodeTemplateDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
        <TemplatesManagerDialog isOpen={isTemplatesManagerOpen} onClose={() => setIsTemplatesManagerOpen(false)} />
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
        <AddVirtualDialog
          isOpen={isVirtualDialogOpen}
          onClose={() => setIsVirtualDialogOpen(false)}
          onAdd={handleAddVirtualNode}
          diagrams={diagrams}
          currentDomain={currentDomain}
        />
        // <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
        //   <div className="w-[600px] max-w-[90vw] rounded-md border bg-background shadow-lg">
        //     <div className="border-b px-3 py-2 text-sm font-medium">Add virtual node</div>
        //     <div className="p-3 space-y-3">
        //       <input
        //         className="w-full rounded border px-2 py-1 bg-transparent"
        //         placeholder="Search nodes by label..."
        //         value={virtualSearch}
        //         onChange={(e) => setVirtualSearch(e.target.value)}
        //       />
        //       <div className="max-h-64 overflow-auto border rounded">
        //         <ul>
        //           {filteredFlattened.map((item) => {
        //             const isSelected = virtualSelection?.nodeId === item.nodeId && virtualSelection.diagramId === item.diagramId;
        //             return (
        //               <li key={`${item.diagramId}:${item.nodeId}`}>
        //                 <button
        //                   className={`w-full text-left px-3 py-2 text-sm ${isSelected ? "bg-accent" : "hover:bg-muted"}`}
        //                   onClick={() => setVirtualSelection(item)}
        //                 >
        //                   <div className="font-medium truncate">{item.label}</div>
        //                   <div className="text-xs text-muted-foreground truncate">{item.pathLabels.join(" › ")} {item.pathLabels.length ? "(path)" : ""}</div>
        //                 </button>
        //               </li>
        //             );
        //           })}
        //         </ul>
        //       </div>
        //       <div className="flex justify-end gap-2">
        //         <Button size="sm" variant="outline" onClick={() => setIsVirtualDialogOpen(false)}>Cancel</Button>
        //         <Button size="sm" disabled={!virtualSelection} onClick={confirmAddVirtualNode}>Add</Button>
        //       </div>
        //     </div>
        //   </div>
        // </div>
      )}
    </div>
  );
}


