"use client";

import { Input } from "@/components/ui/input";
import * as React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from "reactflow";

type ShapeKind = "straight" | "bezier" | "smoothstep" | "step";

export function ArchEdge(props: EdgeProps): React.JSX.Element {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerStart,
    markerEnd,
    selected,
  } = props;
  const instance = useReactFlow();

  const shape: ShapeKind = (data?.shape as ShapeKind) ?? "straight";
  const strokeColor: string = typeof data?.strokeColor === "string" && data.strokeColor ? data.strokeColor : "#4b5563"; // gray-600
  const strokeWidth: number = Number(data?.strokeWidth ?? 2);
  const dashed: boolean = Boolean(data?.dashed);
  const animated: boolean = Boolean(data?.animated);

  const labelText: string = typeof data?.label === "string" && data.label ? data.label : String(props.label ?? "");
  const labelFontSize: number = Number(data?.fontSize ?? 12);
  const labelColor: string = typeof data?.labelColor === "string" && data.labelColor ? data.labelColor : "#111827"; // gray-900
  const labelBackground: string = typeof data?.labelBackground === "string" && data.labelBackground ? data.labelBackground : "#ffffff";

  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = React.useMemo(() => {
    if (shape === "bezier")
      return getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    if (shape === "smoothstep" || shape === "step")
      return getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    return getStraightPath({ sourceX, sourceY, targetX, targetY });
  }, [shape, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitLabel = (next: string) => {
    const nextValue = next.trim();
    instance.setEdges((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
            ...e,
            label: nextValue,
            data: { ...(e.data ?? {}), label: nextValue },
          }
          : e
      )
    );
    setIsEditing(false);
  };

  const onDoubleClick = () => setIsEditing(true);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{ stroke: strokeColor, strokeWidth, strokeDasharray: dashed ? 6 : undefined }}
        interactionWidth={20}
      />
      {animated ? (
        <circle r={Math.max(4, strokeWidth+2)} fill={strokeColor} style={{ pointerEvents: "none" }}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      ) : null}

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <Input
              ref={inputRef}
              defaultValue={labelText}
              onBlur={(e) => commitLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="rounded border px-2 py-1 text-xs shadow bg-background min-w-16 max-w-18"
            />
          ) : labelText ? (
            <button
              type="button"
              className="px-1.5 py-0.5 rounded shadow border hover:shadow-md"
              style={{ fontSize: labelFontSize, color: labelColor, background: labelBackground }}
              onDoubleClick={onDoubleClick}
            >
              {labelText}
            </button>
          ) : (
            <button
              type="button"
              className="px-1 py-0.5 text-[10px] rounded border text-muted-foreground bg-background/70 hover:bg-background"
              onDoubleClick={onDoubleClick}
              title="Double-click to add label"
            >
              + label
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}


