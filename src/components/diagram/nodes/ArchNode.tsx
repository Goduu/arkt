"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, Position, useReactFlow } from "reactflow";
import { useAppStore } from "@/lib/store";
import type { DiagramNode, NodeKind } from "@/lib/types";

type ArchNodeData = {
  label: string;
  fillColor?: string;
  textColor?: string;
  nodeKind?: NodeKind;
  rotation?: number;
  onLabelCommit?: (newLabel: string) => void;
};

export function ArchNode(props: NodeProps<ArchNodeData>): React.JSX.Element {
  const { id } = props;
  const { diagrams, currentId, updateNode, renameDiagram } = useAppStore();
  const diagram = diagrams[currentId];
  const domainNode: DiagramNode | undefined = diagram?.nodes.find((n) => n.id === id);
  const [value, setValue] = React.useState<string>(props.data.label);
  const rf = useReactFlow();

  React.useEffect(() => {
    setValue(props.data.label);
  }, [props.data.label]);

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
  const kind = props.data.nodeKind ?? (domainNode?.type ?? "rectangle");

  const roundedClass = kind === "ellipse" ? "rounded-full" : "rounded-md";
  const borderClass = kind === "container" ? "border-dashed" : "border";
  const isTailwindBg = typeof fill === "string" && fill.startsWith("bg-");
  const isTailwindText = typeof text === "string" && text.startsWith("text-");
  const backgroundStyle = kind === "text" ? undefined : isTailwindBg ? undefined : fill;

  return (
    <div
      className={`${roundedClass} ${borderClass} shadow-sm min-w-[140px] w-full h-full ${kind !== "text" && isTailwindBg ? String(fill) : ""} ${isTailwindText ? String(text) : ""}`}
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
            const next = e.target.value;
            setValue(next);
            rf.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: next } } : n)));
          }}
          onBlur={onBlur}
        />
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}


