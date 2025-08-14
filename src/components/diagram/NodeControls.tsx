"use client";

import * as React from "react";
import type { Node as RFNode } from "reactflow";
import { X } from "lucide-react";
import { type TailwindBgFamily, type TailwindBgShade } from "@/lib/utils";
import { ColorSelector } from "@/components/diagram/ColorSelectorO";
import { Button } from "@/components/ui/button";
import { IconSelector } from "@/components/diagram/IconSelector";
import { ArchNodeView } from "@/components/diagram/nodes/ArchNodeView";

type Props = {
  selectedNode: RFNode | null;
  onChange: (node: RFNode) => void;
  onClose: () => void;
};

export function NodeControls({ selectedNode, onChange, onClose }: Props) {

  const data = (selectedNode?.data ?? {}) as Readonly<{ label?: string; description?: string; fillColor?: string; textColor?: string; borderColor?: string; iconKey?: string; nodeKind?: string; rotation?: number; width?: number; height?: number }>;
  const [label, setLabel] = React.useState<string>(String(data.label ?? ""));
  const [description, setDescription] = React.useState<string>(String(data.description ?? ""));
  const [fillColor, setFillColor] = React.useState<string>(String(data.fillColor ?? "#ffffff"));
  const [textColor, setTextColor] = React.useState<string>(String(data.textColor ?? "#111827"));
  const [borderColor, setBorderColor] = React.useState<string>(String(data.borderColor ?? "border-slate-300"));
  const [iconKey, setIconKey] = React.useState<string | undefined>(data.iconKey);
  const [nodeKind, setNodeKind] = React.useState<string>(String(data.nodeKind ?? "rectangle"));
  const [rotation, setRotation] = React.useState<number>(Number(data.rotation ?? 0));
  const [width, setWidth] = React.useState<number>(Number(selectedNode?.width ?? data.width ?? 180));
  const [height, setHeight] = React.useState<number>(Number(selectedNode?.height ?? data.height ?? 80));

  // Tailwind color selector state for fill color
  const [fillFamily, setFillFamily] = React.useState<TailwindBgFamily>("blue");
  const [fillShade, setFillShade] = React.useState<TailwindBgShade>(500);

  React.useEffect(() => {
    setLabel(String(data.label ?? ""));
    setDescription(String(data.description ?? ""));
    setFillColor(String(data.fillColor ?? "#ffffff"));
    setTextColor(String(data.textColor ?? "#111827"));
    setIconKey(data.iconKey);
    setNodeKind(String(data.nodeKind ?? "rectangle"));
    setRotation(Number(data.rotation ?? 0));
    setWidth(Number(selectedNode?.width ?? data.width ?? 180));
    setHeight(Number(selectedNode?.height ?? data.height ?? 80));
    setBorderColor(String(data.borderColor ?? "border-slate-300"));
    // Initialize tailwind selector state from fillColor when possible
    const parsed = String(data.fillColor ?? "").match(/^bg-([a-z]+)-(300|500|700)$/);
    if (parsed) {
      setFillFamily(parsed[1] as TailwindBgFamily);
      setFillShade(Number(parsed[2]) as TailwindBgShade);
    } else {
      setFillFamily("blue");
      setFillShade(500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  const commit = (partial?: Partial<{ label: string; description: string; fillColor: string; textColor: string; borderColor: string; iconKey?: string; nodeKind: string; rotation: number; width: number; height: number }>) => {
    const next = {
      label,
      description,
      fillColor,
      textColor,
      borderColor,
      iconKey,
      nodeKind,
      rotation,
      width,
      height,
      ...(partial ?? {}),
    };

    const updated: RFNode = {
      ...selectedNode,
      data: { ...(selectedNode?.data ?? {}), ...next },
      // style width/height helps React Flow size the component
      style: { ...(selectedNode?.style ?? {}), width: next.width, height: next.height },
    } as RFNode;

    onChange(updated);
  };

  if (!selectedNode) return null;

  return (
    <div className="fixed top-16 right-4 w-80 max-h-[80vh] overflow-auto bg-background border shadow-lg rounded-md">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">Node options</div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3 space-y-3 text-sm">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Label</label>
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => commit()}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Description</label>
          <textarea
            className="w-full rounded border px-2 py-1 bg-transparent resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => commit()}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <ColorSelector
              label="Fill color"
              value={fillColor}
              onChange={(next) => { setFillColor(next); commit({ fillColor: next }); }}
            />
          </div>
          <div>
            <ColorSelector
              label="Text color"
              value={textColor}
              onChange={(next) => { setTextColor(next); commit({ textColor: next }); }}
            />
          </div>
        </div>
        <div>
          <IconSelector
            label="Icon"
            value={iconKey}
            onChange={(next) => { setIconKey(next); commit({ iconKey: next }); }}
          />
        </div>
        <div>
          <ColorSelector
            label="Border color"
            mode="border"
            value={borderColor}
            onChange={(next) => { setBorderColor(next); commit({ borderColor: next }); }}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Preview</label>
          <div className="border rounded-md p-2 grid place-items-center">
            <ArchNodeView
              label={label || "Node"}
              nodeKind={nodeKind}
              fillColor={fillColor}
              textColor={textColor}
              borderColor={borderColor}
              iconKey={iconKey}
              rotation={rotation}
              width={Math.max(120, Math.min(320, width))}
              height={Math.max(60, Math.min(240, height))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Width</label>
            <input
              type="number"
              min={40}
              className="w-full rounded border px-2 py-1 bg-transparent"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              onBlur={() => commit()}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Height</label>
            <input
              type="number"
              min={24}
              className="w-full rounded border px-2 py-1 bg-transparent"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              onBlur={() => commit()}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Type</label>
            <select
              className="w-full rounded border px-2 py-1 bg-transparent"
              value={nodeKind}
              onChange={(e) => { setNodeKind(e.target.value); commit({ nodeKind: e.target.value }); }}
            >
              <option value="rectangle">Rectangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="text">Text</option>
              <option value="container">Container</option>
            </select>
          </div>
          <div />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={() => commit()}>Apply</Button>
        </div>
      </div>
    </div>
  );
}


