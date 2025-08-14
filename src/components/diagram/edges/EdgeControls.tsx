"use client";

import * as React from "react";
import { type Edge as RFEdge, MarkerType } from "reactflow";
import { Button } from "@/components/ui/button";
import { ChevronsLeftRight, ChevronsRight, Minus, Spline } from "lucide-react";
import { IoAnalyticsOutline, TbLine, TbLineDashed } from "@/lib/Icons";
import { StrokeTypeSelector } from "./StrokeTypeSelector";
import { ShapeKind } from "./types";
import { StrokeWidth } from "./StrokeWidth";
import { ColorSelector } from "../ColorSelector";
import { StrokeType } from "./StrokeType";
import { EdgeMarker } from "./EdgeMarker";


type Props = {
  selectedEdge: RFEdge | null;
  onChange: (edge: RFEdge) => void;
};

export function EdgeControls({ selectedEdge, onChange }: Props) {

  const data = (selectedEdge?.data ?? {}) as Readonly<{
    shape?: ShapeKind;
    strokeColor?: string;
    strokeWidth?: number;
    dashed?: boolean;
    animated?: boolean;
    label?: string;
    fontSize?: number;
    labelColor?: string;
    labelBackground?: string;
  }>;

  const [shape, setShape] = React.useState<ShapeKind>(data.shape ?? "straight");
  const [strokeColor, setStrokeColor] = React.useState<string>(data.strokeColor ?? "#4b5563");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(Number(data.strokeWidth ?? 2));
  const [dashed, setDashed] = React.useState<boolean>(Boolean(data.dashed));
  const [animated, setAnimated] = React.useState<boolean>(Boolean(data.animated));
  const [label, setLabel] = React.useState<string>(String((data.label ?? selectedEdge?.label ?? "")));
  const [fontSize, setFontSize] = React.useState<number>(Number(data.fontSize ?? 12));
  const [labelColor, setLabelColor] = React.useState<string>(data.labelColor ?? "#111827");
  const [labelBackground, setLabelBackground] = React.useState<string>(data.labelBackground ?? "#ffffff");
  const [markerDirection, setMarkerDirection] = React.useState<"start" | "end" | "both" | "">("");

  React.useEffect(() => {
    const d = (selectedEdge?.data ?? {}) as any;
    setShape(d.shape ?? "straight");
    setStrokeColor(d.strokeColor ?? "#4b5563");
    setStrokeWidth(Number(d.strokeWidth ?? 2));
    setDashed(Boolean(d.dashed));
    setAnimated(Boolean(d.animated));
    setLabel(String(d.label ?? selectedEdge?.label ?? ""));
    setFontSize(Number(d.fontSize ?? 12));
    setLabelColor(d.labelColor ?? "#111827");
    setLabelBackground(d.labelBackground ?? "#ffffff");
    const hasStart = Boolean((selectedEdge as any)?.markerStart);
    const hasEnd = Boolean((selectedEdge as any)?.markerEnd);
    setMarkerDirection(hasStart && hasEnd ? "both" : hasStart ? "start" : hasEnd ? "end" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEdge?.id]);

  const commit = (partial?: Partial<{ shape: ShapeKind; strokeColor: string; strokeWidth: number; dashed: boolean; animated: boolean; label: string; fontSize: number; labelColor: string; labelBackground: string }>) => {
    const nextData = {
      shape,
      strokeColor,
      strokeWidth,
      dashed,
      animated,
      label,
      fontSize,
      labelColor,
      labelBackground,
      ...(partial ?? {}),
    };
    const next: RFEdge = {
      ...selectedEdge,
      type: "arch",
      data: { ...(selectedEdge?.data ?? {}), ...nextData },
      label: nextData.label,
    } as RFEdge;
    onChange(next);
  };

  const commitMarkers = (direction: "start" | "end" | "both" | "") => {
    if (!selectedEdge) return;
    const next: RFEdge = {
      ...selectedEdge,
      markerStart: direction === "start" || direction === "both" ? { type: MarkerType.ArrowClosed } : undefined,
      markerEnd: direction === "end" || direction === "both" ? { type: MarkerType.ArrowClosed } : undefined,
    } as RFEdge;
    onChange(next);
  };

  if (!selectedEdge) return null;

  return (
    <div className="fixed top-16 right-4 w-80 max-h-[80vh] overflow-auto bg-background border shadow-lg rounded-md">
      <div className="px-3 py-2 border-b text-sm font-medium">Edge options</div>
      <div className="p-3 space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-4">
          <StrokeTypeSelector selectedStrokeType={shape} setStrokeType={setShape} commit={commit} />
          <StrokeWidth commit={commit} selectedWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />
          <EdgeMarker
            value={markerDirection}
            onChange={(dir) => {
              if (dir === null) return;
              setMarkerDirection(dir);
              commitMarkers(dir);
            }}
          />
        </div>
        <StrokeType value={[dashed ? "dashed" : false, animated ? "animated" : false].filter(Boolean)}
          onChange={(values: string[]) => {
            setDashed(values.includes("dashed"))
            setAnimated(values.includes("animated"))
            commit({ dashed: values.includes("dashed"), animated: values.includes("animated") })
          }} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Stroke color</label>
            <ColorSelector
              value={strokeColor}
              onChange={(color) => { setStrokeColor(color); commit({ strokeColor: color }); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={animated} onChange={(e) => { setAnimated(e.target.checked); commit({ animated: e.target.checked }); }} /> animated</label>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Label</label>
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => commit()}
            placeholder="Double-click edge to edit inline"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Font size</label>
            <input type="number" min={8} max={32} className="w-full rounded border px-2 py-1 bg-transparent" value={fontSize} onChange={(e) => { const v = Number(e.target.value); setFontSize(v); commit({ fontSize: v }); }} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Text color</label>
            <input type="color" className="w-full h-8 rounded border" value={labelColor} onChange={(e) => { setLabelColor(e.target.value); commit({ labelColor: e.target.value }); }} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Background</label>
            <input type="color" className="w-full h-8 rounded border" value={labelBackground} onChange={(e) => { setLabelBackground(e.target.value); commit({ labelBackground: e.target.value }); }} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" onClick={() => commit()}>Apply</Button>
        </div>
      </div>
    </div>
  );
}
