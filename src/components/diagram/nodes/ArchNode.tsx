"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useReactFlow } from "reactflow";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramNode, NodeKind } from "@/lib/types";

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

  return (
    <div
      className={`${roundedClass} ${borderClass} shadow-sm min-w-[140px] w-full h-full ${kind !== "text" && isTailwindBg ? String(fill) : ""} ${isTailwindText ? String(text) : ""} ${isVirtual ? "cursor-pointer" : ""}`}
      style={{
        backgroundColor: backgroundStyle,
        color: isTailwindText ? undefined : text,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
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


