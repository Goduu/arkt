"use client";

import { useReactFlow, useUpdateNodeInternals, type NodeProps } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { drag, type D3DragEvent, type DragBehavior } from 'd3-drag';
import { select } from 'd3-selection';

export type ArchLineNodeData = {
    fillColor?: string; // fallback if borderColor is not set
    borderColor?: string; // primary color for the line bar
    rotation?: number;
};

export function ArchLineNode(props: NodeProps<ArchLineNodeData>): React.JSX.Element {
    const border = props.data.borderColor ?? undefined;
    const fill = props.data.fillColor ?? undefined;

    const isTailwindBorder = typeof border === "string" && border.startsWith("border-");

    const rotateControlRef = useRef(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rf = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const [rotation, setRotation] = useState(props.data.rotation ?? 0);

    // Sync local state if external data changes
    useEffect(() => {
        setRotation(props.data.rotation ?? 0);
    }, [props.data.rotation]);

    useEffect(() => {
        if (!rotateControlRef.current) {
            return;
        }

        const selection = select<HTMLDivElement, unknown>(rotateControlRef.current as HTMLDivElement);
        const dragHandler: DragBehavior<HTMLDivElement, unknown, unknown> = drag<HTMLDivElement, unknown, unknown>()
          .on('drag', (evt: D3DragEvent<HTMLDivElement, unknown, unknown>) => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const se = evt.sourceEvent as MouseEvent | PointerEvent | TouchEvent | undefined;
            let clientX = (evt as unknown as { x?: number }).x as number | undefined;
            let clientY = (evt as unknown as { y?: number }).y as number | undefined;
            if (se && (clientX == null || clientY == null)) {
              if ('clientX' in se && typeof (se as any).clientX === 'number') {
                clientX = (se as MouseEvent | PointerEvent).clientX;
                clientY = (se as MouseEvent | PointerEvent).clientY;
              } else if ('touches' in se && (se as TouchEvent).touches?.length) {
                clientX = (se as TouchEvent).touches[0].clientX;
                clientY = (se as TouchEvent).touches[0].clientY;
              }
            }
            if (clientX == null || clientY == null) return;
            const rad = Math.atan2(clientY - cy, clientX - cx);
            const deg = rad * (180 / Math.PI);
            const raw = 180 - deg;
            const snapped = Math.round(raw / 30) * 30;
            setRotation(snapped);
            rf.setNodes((prev) => prev.map((n) => (
              n.id === props.id
                ? { ...n, data: { ...(n.data as object), rotation: snapped } }
                : n
            )));
            updateNodeInternals(props.id);
          });

        selection.call(dragHandler as unknown as (s: unknown) => void);

        return () => {
            // detach d3 listeners
            selection.on('.drag', null);
        };
    }, [props.id, rf, updateNodeInternals]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "rounded-none origin-center border-0 group min-w-10 w-full h-full relative",
                isTailwindBorder ? String(border) : ""
            )}
            style={{
                backgroundColor: isTailwindBorder ? undefined : (border ?? fill ?? "#334155"),
                transform: `rotate(${rotation}deg)`,
            }}
        >

            <div ref={rotateControlRef}
                className={
                    cn(
                        props.selected ? "opacity-100" : "opacity-0",
                        "absolute w-[10px] h-[10px] bg-[#3367d9] ",
                        "left-1/2 top-[-60px] rounded-full ",
                        "-translate-x-1/2 -translate-y-1/2 cursor-alias",
                        "after:content-[''] after:block after:absolute ",
                        "after:left-[4px] after:top-[5px]"
                    )}
            />
            <NodeResizer
                isVisible={props.selected}
                minWidth={20}
                minHeight={2}
                maxHeight={2}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />
        </div>
    );
}


