"use client";

import * as React from "react";
import { NodeResizer, useReactFlow, useUpdateNodeInternals, type NodeProps, type Node as RFNode } from "reactflow";
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
    const rf = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const isDraggingRef = React.useRef<boolean>(false);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (draggingIdx == null) return;
        // Map screen to flow position to be accurate under pan/zoom
        const flowPos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const node = rf.getNode(id);
        if (!node) return;

        // Convert to node-local coordinates
        const localX = flowPos.x - node.position.x;
        const localY = flowPos.y - node.position.y;

        const next = (data.points ?? []).map((p, i) => (i === draggingIdx ? { x: localX, y: localY } : p));
        data.onUpdatePoints?.(data.lineId, next);
    }, [draggingIdx, data, id, rf]);

    const handleMouseUp = React.useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setDraggingIdx(null);

        const pts = data.points ?? [];
        if (pts.length === 0) return;

        let minX = pts[0].x;
        let maxX = pts[0].x;
        let minY = pts[0].y;
        let maxY = pts[0].y;
        for (let i = 1; i < pts.length; i++) {
            const p = pts[i];
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        const pad = PAD;
        const nextW = Math.max(1, (maxX - minX) + pad * 2);
        const nextH = Math.max(1, (maxY - minY) + pad * 2);
        const normalized = pts.map((p) => ({ x: p.x - minX + pad, y: p.y - minY + pad }));

        rf.setNodes((prev) => prev.map((n) => {
            if (n.id !== id) return n;
            const nextPos = { x: n.position.x + minX - pad, y: n.position.y + minY - pad };
            const nextStyle = { ...(n.style ?? {}), width: nextW, height: nextH } as RFNode['style'];
            return { ...n, position: nextPos, style: nextStyle } as RFNode;
        }));
        updateNodeInternals(id);
        data.onUpdatePoints?.(data.lineId, normalized);
    }, [data, id, rf, updateNodeInternals, PAD]);

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
            <NodeResizer
                isVisible={props.selected && draggingIdx == null}
                minWidth={120}
                minHeight={60}
                handleStyle={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    border: "1px solid #7c3aed",
                }}
            />
            <svg ref={svgRef} className="absolute inset-0 w-full h-full overflow-visible"
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
                            isDraggingRef.current = true;
                            setDraggingIdx(idx);
                        }}
                        style={{ cursor: draggingIdx === idx ? "grabbing" : "grab" }}
                    />
                ))}
            </svg>
        </div>
    );
}


