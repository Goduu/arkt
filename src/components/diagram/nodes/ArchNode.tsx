"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, NodeToolbar, Position, useReactFlow } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode, NodeKind } from "@/lib/types";
import { VirtualLink } from "./types";
import { VirtualLinkIndicator } from "./VirtualLinkIndicator";
import { NodeColorFormToolbar } from "./NodeColorFormToolbar";
import { getIconByKey } from "@/lib/iconRegistry";
import { cn, getTailwindBgClass, TAILWIND_MAIN_COLORS, TailwindBgFamily } from "@/lib/utils";

export type ArchNodeData = {
  label: string;
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  iconKey?: string;
  nodeKind?: NodeKind;
  rotation?: number;
  virtualOf?: string;
  onLabelCommit?: (newLabel: string) => void;
};

export function ArchNode(props: NodeProps<ArchNodeData>): React.JSX.Element {
  const { id } = props;
  const { diagrams, currentId, updateNode, renameDiagram } = useAppStore();
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
  const iconKey = props.data.iconKey ?? undefined;
  const rotation = props.data.rotation ?? 0;
  const border = props.data.borderColor ?? undefined;

  const roundedClass = kind === "ellipse" ? "rounded-full" : "rounded-md";
  const borderClass = isVirtual ? "border border-dashed" : "border";
  const isTailwindBg = typeof fill === "string" && fill.startsWith("bg-");
  const isTailwindText = typeof text === "string" && text.startsWith("text-");
  const isTailwindBorder = typeof border === "string" && border.startsWith("border-");
  const backgroundStyle = isTailwindBg ? undefined : fill;

  return (
    <div
      className={cn(
        roundedClass, borderClass,
        "group shadow-sm min-w-32 w-full h-full relative",
        isTailwindBg ? String(fill) : "",
        isTailwindText ? String(text) : "",
        isTailwindBorder ? String(border) : "",
        isVirtual ? "cursor-pointer" : ""
      )}
      style={{
        backgroundColor: backgroundStyle,
        color: isTailwindText ? undefined : text,
        borderColor: isTailwindBorder ? undefined : border,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      {/* Node icon badge */}
      {iconKey && (
        <div className="absolute -left-3 -top-3 z-10 rounded-md bg-background/80 backdrop-blur border text-muted-foreground p-1 leading-none shadow-sm">
          {(() => {
            const def = getIconByKey(iconKey);
            if (!def) return null;
            const I = def.Icon;
            return <I className="h-4 w-4" aria-label={def.label} />;
          })()}
        </div>
      )}

      <NodeResizer
        isVisible={props.selected}
        minWidth={120}
        minHeight={60}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          border: "1px solid #7c3aed",
        }}
      />
      {/* Two-way relation indicator for original nodes referenced by virtual nodes */}
      {!isVirtual && virtualLinksToThisNode.length > 0 && (
        <VirtualLinkIndicator className="opacity-30 group-hover:opacity-100" virtualLinksToThisNode={virtualLinksToThisNode} />
      )}
      <NodeToolbar
        isVisible={props.selected}
        className="nopan"
      >
        <NodeColorFormToolbar
          colors={TAILWIND_MAIN_COLORS}
          fillColor={props.data.fillColor}
          onClick={(family: TailwindBgFamily) => {
            const nextClass = getTailwindBgClass(family, 500);
            rf.setNodes((prev) =>
              prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, fillColor: nextClass } } : n))
            );
          }} />

      </NodeToolbar>

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
      <Handle className="opacity-30 group-hover:opacity-100" type="source" position={Position.Right} />
      <Handle className="opacity-30 group-hover:opacity-100" type="target" position={Position.Left} />
    </div>
  );
}


