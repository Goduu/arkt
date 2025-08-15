"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export type ArchPolylinePoint = { x: number; y: number };

export type ArchPolylineData = {
  lineId: string;
  points: ArchPolylinePoint[]; // relative to node's top-left
  strokeColor?: string;
  strokeWidth?: number;
  dashed?: boolean;
  padding?: number;
  onUpdatePoints?: (lineId: string, nextRelativePoints: ArchPolylinePoint[]) => void;
};

export function ArchPolylineNode(props: NodeProps<ArchPolylineData>): React.JSX.Element {
  const { data, selected, id } = props;
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);

  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const HANDLE_RADIUS = 6;
  const PAD = Math.max(Number(data.padding ?? 8), HANDLE_RADIUS + 2);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (draggingIdx == null) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const x = Math.max(PAD, Math.min(dims.w - PAD, rawX));
    const y = Math.max(PAD, Math.min(dims.h - PAD, rawY));
    const next = (data.points ?? []).map((p, i) => (i === draggingIdx ? { x, y } : p));
    data.onUpdatePoints?.(data.lineId, next);
  }, [draggingIdx, data, dims.w, dims.h]);

  const handleMouseUp = React.useCallback(() => {
    setDraggingIdx(null);
  }, []);

  React.useEffect(() => {
    if (draggingIdx == null) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingIdx, handleMouseMove, handleMouseUp]);

  // Measure container once and on resize to keep a stable viewBox during drags
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      const next = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
      setDims(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = Math.max(1, dims.w);
  const h = Math.max(1, dims.h);
  const stroke = data.strokeColor ?? "#4b5563";
  const strokeWidth = Math.max(1, Number(data.strokeWidth ?? 2));
  const dash = data.dashed ? "6 6" : undefined;

  return (
    <div ref={containerRef} className={cn("relative w-full h-full overflow-visible")}> 
      <svg ref={svgRef} className="absolute inset-0 w-full h-full"
           viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline
          points={(data.points ?? []).map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={selected ? "#3b82f6" : stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={dash}
        />
        {selected && (data.points ?? []).map((pt, idx) => (
          <circle
            key={`${id}-pt-${idx}`}
            className="nodrag"
            cx={pt.x}
            cy={pt.y}
            r={HANDLE_RADIUS}
            fill="#ffffff"
            stroke="#3b82f6"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingIdx(idx);
            }}
            style={{ cursor: draggingIdx === idx ? "grabbing" : "grab" }}
          />
        ))}
      </svg>
    </div>
  );
}


