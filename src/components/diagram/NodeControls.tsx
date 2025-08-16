"use client";

import type { Node as RFNode } from "reactflow";
import { X } from "lucide-react";
import { type TailwindBgFamily, type TailwindBgShade } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LineNodeControls } from "./LineNodeControls";
import { BasicNodeControl } from "./BasicNodeControl";
import { useEffect, useState } from "react";

type Props = {
  selectedNode: RFNode | null;
  onChange: (node: RFNode) => void;
  onClose: () => void;
};

export function NodeControls({ selectedNode, onChange, onClose }: Props) {

  const data = (selectedNode?.data ?? {}) as Readonly<{ label?: string; description?: string; fillColor?: string; textColor?: string; borderColor?: string; iconKey?: string; nodeKind?: string; rotation?: number; width?: number; height?: number }>;
  const [label, setLabel] = useState<string>(String(data.label ?? ""));
  const [description, setDescription] = useState<string>(String(data.description ?? ""));
  const [fillColor, setFillColor] = useState<string>(String(data.fillColor ?? "#ffffff"));
  const [textColor, setTextColor] = useState<string>(String(data.textColor ?? "#111827"));
  const [borderColor, setBorderColor] = useState<string>(String(data.borderColor ?? "border-slate-300"));
  const [iconKey, setIconKey] = useState<string | undefined>(data.iconKey);
  const [nodeKind, setNodeKind] = useState<string>(String(data.nodeKind ?? "rectangle"));
  const [rotation, setRotation] = useState<number>(Number(data.rotation ?? 0));
  const [width, setWidth] = useState<number>(Number(selectedNode?.width ?? data.width ?? 180));
  const [height, setHeight] = useState<number>(Number(selectedNode?.height ?? data.height ?? 80));

  // For ArchLineNode: show only stroke color and stroke width
  const isLineKind = selectedNode?.type === "archPolylineNode";
  const isTemplateNode = Boolean(selectedNode?.data.templateId);
  console.log("selectedNode", selectedNode);
  const [lineStrokeColor, setLineStrokeColor] = useState<string>(() => {
    const sc = String(((selectedNode?.data as unknown as { strokeColor?: string })?.strokeColor) ?? "");
    return sc.startsWith("#") ? sc : "#334155"; // slate-700
  });
  const [lineStrokeWidth, setLineStrokeWidth] = useState<number>(Number(((selectedNode?.data as unknown as { strokeWidth?: number })?.strokeWidth ?? 2)));

  // Tailwind color selector state for fill color
  const [fillFamily, setFillFamily] = useState<TailwindBgFamily>("blue");
  const [fillShade, setFillShade] = useState<TailwindBgShade>(500);

  useEffect(() => {
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
    // Init polyline controls from node.data
    const sc = String(((selectedNode?.data as unknown as { strokeColor?: string })?.strokeColor) ?? "");
    setLineStrokeColor(sc.startsWith("#") ? sc : "#334155");
    setLineStrokeWidth(Number(((selectedNode?.data as unknown as { strokeWidth?: number })?.strokeWidth ?? 2)));
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
      width: nodeKind === "square" ? Math.max(1, Math.min(2000, width)) : width,
      height: nodeKind === "square" ? Math.max(1, Math.min(2000, width)) : (nodeKind === "line" ? Math.max(1, Math.min(2000, height)) : height),
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

  const commitLine = (partial?: Partial<{ strokeColor: string; strokeWidth: number }>) => {
    const nextStrokeColor = partial?.strokeColor ?? lineStrokeColor;
    const nextStrokeWidth = Number(partial?.strokeWidth ?? lineStrokeWidth) || 2;
    const updated: RFNode = {
      ...selectedNode,
      data: { ...(selectedNode?.data ?? {}), strokeColor: nextStrokeColor, strokeWidth: nextStrokeWidth },
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
        {isLineKind && (
          <LineNodeControls
            lineStrokeColor={lineStrokeColor}
            lineStrokeWidth={lineStrokeWidth}
            onClose={onClose}
            commitLine={commitLine}
            setLineStrokeColor={setLineStrokeColor}
            setLineStrokeWidth={setLineStrokeWidth}
          />
        )}

        {!isLineKind && !isTemplateNode && (
          <BasicNodeControl
            label={label}
            setLabel={setLabel}
            description={description}
            setDescription={setDescription}
            fillColor={fillColor}
            setFillColor={setFillColor}
            textColor={textColor}
            setTextColor={setTextColor}
            borderColor={borderColor}
            setBorderColor={setBorderColor}
            iconKey={iconKey}
            nodeKind={nodeKind}
            rotation={rotation}
            width={width}
            height={height}
            setWidth={setWidth}
            setHeight={setHeight}
            commit={commit}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}


