"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useReactFlow } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode, NodeKind } from "@/lib/types";
import { Link as LinkIcon } from "lucide-react";

type ArchNodeData = {
  label: string;
  fillColor?: string;
  textColor?: string;
  nodeKind?: NodeKind;
  rotation?: number;
  virtualOf?: string;
  onLabelCommit?: (newLabel: string) => void;
};

export function ArchNode(props: NodeProps<ArchNodeData>): React.JSX.Element {
  const { id } = props;
  const { diagrams, currentId, updateNode, renameDiagram, navigateTo, setDrillStack, setPendingFocus } = useAppStore();
  const diagram = diagrams[currentId];
  const domainNode: DiagramNode | undefined = diagram?.nodes.find((n) => n.id === id);
  const [value, setValue] = React.useState<string>(props.data.label);
  const rf = useReactFlow();

  const kind = props.data.nodeKind ?? (domainNode?.type ?? "rectangle");
  const isVirtual = kind === "virtual" || Boolean(props.data.virtualOf);

  const findNodeDeepInDiagram = React.useCallback((root: Diagram | undefined, targetId: string | undefined): DiagramNode | undefined => {
    if (!root || !targetId) return undefined;
    const stack: DiagramNode[] = [...(root.nodes ?? [])];
    while (stack.length > 0) {
      const n = stack.pop()!;
      if (n.id === targetId) return n;
      if (n.diagram?.nodes?.length) stack.push(...n.diagram.nodes);
    }
    return undefined;
  }, []);

  const originalNode = React.useMemo(() => {
    if (!isVirtual) return undefined;
    const targetId = props.data.virtualOf;
    if (!targetId) return undefined;
    // search current diagram first, then all diagrams
    const inCurrent = findNodeDeepInDiagram(diagram, targetId);
    if (inCurrent) return inCurrent;
    for (const d of Object.values(diagrams)) {
      const found = findNodeDeepInDiagram(d, targetId);
      if (found) return found;
    }
    return undefined;
  }, [isVirtual, props.data.virtualOf, diagram, diagrams, findNodeDeepInDiagram]);

  // Collect connections coming from virtual nodes that reference THIS node (when we're rendering an original node)
  type VirtualLink = {
    diagramId: string;
    diagramName: string;
    containerPathIds: string[]; // path to the subdiagram where the connection happens
    nodePathIds: string[]; // path including the virtual node id
    pathLabels: string[]; // labels along nodePathIds (includes virtual node label at end)
    viaVirtualNodeId: string;
    otherEndNodeId: string;
    otherEndNodeLabel: string;
    direction: "incoming" | "outgoing" | "undirected";
  };

  const virtualLinksToThisNode: VirtualLink[] = React.useMemo(() => {
    if (!diagrams) return [];
    if (isVirtual) return [];
    const results: VirtualLink[] = [];

    // Walk every diagram and its nested subdiagrams
    for (const [dId, d] of Object.entries(diagrams)) {
      const stack: Array<{
        diagramId: string;
        diagramName: string;
        nodes: DiagramNode[];
        edges: DiagramEdge[];
        pathIds: string[];
        pathLabels: string[];
      }> = [{ diagramId: dId, diagramName: d.name, nodes: d.nodes ?? [], edges: d.edges ?? [], pathIds: [], pathLabels: [] }];

      while (stack.length > 0) {
        const frame = stack.pop()!;
        const { diagramId: frameDiagramId, diagramName: frameDiagramName, nodes, edges, pathIds, pathLabels } = frame;

        // Build quick lookup for node labels in this subdiagram
        const idToNode: Record<string, DiagramNode> = Object.fromEntries(nodes.map((n) => [n.id, n] as const));

        for (const n of nodes) {
          // If this node is a virtual reference to our current original node id
          if (n.type === "virtual" && n.data?.virtualOf === id) {
            // Find edges in this same subdiagram that touch the virtual node
            const touching = edges.filter((e) => e.source === n.id || e.target === n.id);
            for (const e of touching) {
              const otherId = e.source === n.id ? e.target : e.source;
              const otherNode = idToNode[otherId];
              if (!otherNode) continue;
              const dir: VirtualLink["direction"] = e.source === n.id ? "outgoing" : e.target === n.id ? "incoming" : "undirected";
              results.push({
                diagramId: frameDiagramId,
                diagramName: frameDiagramName,
                containerPathIds: [...pathIds],
                nodePathIds: [...pathIds, n.id],
                pathLabels: [...pathLabels, n.data.label],
                viaVirtualNodeId: n.id,
                otherEndNodeId: otherNode.id,
                otherEndNodeLabel: otherNode.data?.label ?? otherNode.id,
                direction: dir,
              });
            }
          }

          // Recurse into child subdiagram if present
          if (n.diagram?.nodes?.length || n.diagram?.edges?.length) {
            stack.push({
              diagramId: frameDiagramId,
              diagramName: frameDiagramName,
              nodes: n.diagram.nodes ?? [],
              edges: n.diagram.edges ?? [],
              pathIds: [...pathIds, n.id],
              pathLabels: [...pathLabels, n.data?.label ?? ""],
            });
          }
        }
      }
    }
    return results;
  }, [diagrams, id, isVirtual]);

  React.useEffect(() => {
    if (isVirtual) {
      setValue(String(originalNode?.data.label ?? ""));
      return;
    }
    setValue(props.data.label);
  }, [isVirtual, originalNode?.data.label, props.data.label]);

  const onBlur = () => {
    if (props.data.onLabelCommit) {
      props.data.onLabelCommit(value);
      rf.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n)));
      return;
    }
    if (!diagram || !domainNode) return;
    if (value !== domainNode.data.label) {
      updateNode(diagram.id, { ...domainNode, data: { ...domainNode.data, label: value } });
      if (domainNode.data.childDiagramId) {
        renameDiagram(domainNode.data.childDiagramId, value);
      }
      rf.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n)));
    }
  };

  const fill = props.data.fillColor ?? undefined;
  const text = props.data.textColor ?? undefined;
  const rotation = props.data.rotation ?? 0;

  const roundedClass = kind === "ellipse" ? "rounded-full" : "rounded-md";
  const borderClass = isVirtual ? "border border-dashed" : kind === "container" ? "border border-dashed" : "border";
  const isTailwindBg = typeof fill === "string" && fill.startsWith("bg-");
  const isTailwindText = typeof text === "string" && text.startsWith("text-");
  const backgroundStyle = kind === "text" ? undefined : isTailwindBg ? undefined : fill;

  const [showLinks, setShowLinks] = React.useState(false);

  return (
    <div
      className={`${roundedClass} ${borderClass} shadow-sm min-w-[140px] w-full h-full ${kind !== "text" && isTailwindBg ? String(fill) : ""} ${isTailwindText ? String(text) : ""} ${isVirtual ? "cursor-pointer" : ""} relative`}
      style={{
        backgroundColor: backgroundStyle,
        color: isTailwindText ? undefined : text,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      {/* Selection/resize border like Excalidraw */}
      <NodeResizer
        isVisible={props.selected}
        minWidth={120}
        minHeight={60}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: "#7c3aed", // violet-600
          border: "1px solid #7c3aed",
        }}
        lineStyle={{
          border: "1.5px solid #7c3aed",
          borderRadius: kind === "ellipse" ? 9999 : 12,
        }}
      />
      {/* Two-way relation indicator for original nodes referenced by virtual nodes */}
      {!isVirtual && virtualLinksToThisNode.length > 0 && (
        <div className="absolute -top-2 -right-2">
          <button
            className="flex cursor-pointer z-30 items-center gap-1 rounded-full bg-blue-600 text-white text-[10px] px-2 py-1 shadow"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowLinks((v) => !v); }}
            title="Virtual links"
          >
            <LinkIcon className="h-3 w-3" />
            {virtualLinksToThisNode.length}
          </button>
          {showLinks && (
            <div className="absolute right-0 mt-1 w-[260px] max-h-60 overflow-auto rounded-md border bg-background text-foreground text-xs shadow-lg z-10">
              <div className="px-2 py-1 border-b text-[11px] font-medium">Linked via virtual nodes</div>
              <ul>
                {virtualLinksToThisNode.map((lk, idx) => (
                  <li key={`${lk.diagramId}:${idx}`} className="px-2 py-2 border-b last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <div className="font-medium truncate">{lk.otherEndNodeLabel}</div>
                        <div className="text-muted-foreground truncate">{lk.diagramName}{lk.pathLabels.length ? ` › ${lk.pathLabels.join(" › ")}` : ""}</div>
                      </div>
                      <button
                        className="shrink-0 rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to the diagram where the connection happens and open its container path
                          navigateTo(lk.diagramId);
                          // Set pending focus to the subdiagram where the connection occurs
                          setPendingFocus({ diagramId: lk.diagramId, containerPathIds: lk.containerPathIds, focusNodeIds: [lk.viaVirtualNodeId, lk.otherEndNodeId] });
                          setTimeout(() => setDrillStack(lk.containerPathIds), 0);
                          setShowLinks(false);
                        }}
                      >
                        Open
                      </button>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{lk.direction === "incoming" ? "← Incoming" : lk.direction === "outgoing" ? "Outgoing →" : "Linked"}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="px-3 py-2">
        <input
          className="w-full bg-transparent outline-none text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
          value={value}
          onChange={(e) => {
            if (isVirtual) return; // virtual nodes cannot be edited
            const next = e.target.value;
            setValue(next);
            rf.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: next } } : n)));
          }}
          onBlur={() => { if (!isVirtual) onBlur(); }}
          readOnly={isVirtual}
        />
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}


