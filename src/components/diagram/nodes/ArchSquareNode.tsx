"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, NodeToolbar, Position, useReactFlow } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { DiagramNode } from "@/lib/types";
import { getIconByKey } from "@/lib/iconRegistry";
import { cn, getTailwindBgClass, TAILWIND_MAIN_COLORS, TailwindBgFamily } from "@/lib/utils";
import { NodeColorFormToolbar } from "./NodeColorFormToolbar";

export type ArchSquareNodeData = {
  label: string;
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  iconKey?: string;
  rotation?: number;
  onLabelCommit?: (newLabel: string) => void;
};

export function ArchSquareNode(props: NodeProps<ArchSquareNodeData>): React.JSX.Element {
  const { id } = props;
  const { diagrams, currentId, updateNode, renameDiagram } = useAppStore();
  const diagram = diagrams[currentId];
  const domainNode: DiagramNode | undefined = diagram?.nodes.find((n) => n.id === id);
  const [value, setValue] = React.useState<string>(props.data.label);
  const rf = useReactFlow();

  React.useEffect(() => { setValue(props.data.label); }, [props.data.label]);

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

  const isTailwindBg = typeof fill === "string" && fill.startsWith("bg-");
  const isTailwindText = typeof text === "string" && text.startsWith("text-");
  const isTailwindBorder = typeof border === "string" && border.startsWith("border-");
  const backgroundStyle = isTailwindBg ? undefined : fill;

  return (
    <div
      className={cn(
        "rounded-md border group shadow-sm min-w-16 w-full h-full relative",
        isTailwindBg ? String(fill) : "",
        isTailwindText ? String(text) : "",
        isTailwindBorder ? String(border) : "",
      )}
      style={{
        backgroundColor: backgroundStyle,
        color: isTailwindText ? undefined : text,
        borderColor: isTailwindBorder ? undefined : border,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
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
        minWidth={60}
        minHeight={60}
        keepAspectRatio
        handleStyle={{ width: 8, height: 8, borderRadius: 2, border: "1px solid #7c3aed" }}
      />

      <NodeToolbar isVisible={props.selected} className="nopan">
        <NodeColorFormToolbar
          colors={TAILWIND_MAIN_COLORS}
          fillColor={props.data.fillColor}
          onClick={(family: TailwindBgFamily) => {
            const nextClass = getTailwindBgClass(family, 500);
            rf.setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, fillColor: nextClass } } : n)));
          }}
        />
      </NodeToolbar>

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
          onBlur={() => onBlur()}
        />
      </div>
      <Handle className="opacity-30 group-hover:opacity-100" type="source" position={Position.Right} />
      <Handle className="opacity-30 group-hover:opacity-100" type="target" position={Position.Left} />
    </div>
  );
}


