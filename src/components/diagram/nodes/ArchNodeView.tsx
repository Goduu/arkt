"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import type { NodeKind } from "@/lib/types";
import { getIconByKey } from "@/lib/iconRegistry";

export type ArchNodeViewProps = {
  label: string;
  nodeKind?: NodeKind | string;
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  iconKey?: string;
  rotation?: number;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

export function ArchNodeView(props: ArchNodeViewProps): React.JSX.Element {
  const kind = (props.nodeKind ?? "rectangle") as NodeKind | string;
  const isLine = kind === "line";
  const isSquare = kind === "square";
  const isTailwindBg = typeof props.fillColor === "string" && props.fillColor.startsWith("bg-");
  const isTailwindText = typeof props.textColor === "string" && props.textColor.startsWith("text-");

  const roundedClass = kind === "ellipse" ? "rounded-full" : isLine ? "rounded-none" : "rounded-md";
  const borderClass = kind === "container" ? "border border-dashed" : isLine ? "border-0" : "border";
  const isTailwindBorder = typeof props.borderColor === "string" && props.borderColor.startsWith("border-");
  const backgroundStyle = kind === "text"
    ? undefined
    : isLine
      ? (isTailwindBorder ? undefined : (props.borderColor ?? props.fillColor))
      : (isTailwindBg ? undefined : props.fillColor);

  const IconBadge = React.useMemo(() => {
    if (!props.iconKey) return null;
    const def = getIconByKey(props.iconKey);
    if (!def) return null;
    const I = def.Icon;
    return (
      <div className="absolute -left-3 -top-3 z-10 rounded-md bg-background/80 backdrop-blur border text-muted-foreground p-1 leading-none shadow-sm">
        <I className="h-4 w-4" aria-label={def.label} />
      </div>
    );
  }, [props.iconKey]);

  return (
    <div
      className={`${roundedClass} ${borderClass} shadow-sm relative ${kind !== "text" && isTailwindBg ? String(props.fillColor) : ""} ${isTailwindText ? String(props.textColor) : ""} ${isTailwindBorder ? String(props.borderColor) : ""} ${props.className ?? ""}`}
      style={{
        width: props.width,
        height: props.height,
        backgroundColor: backgroundStyle,
        color: isTailwindText ? undefined : props.textColor,
        borderColor: isTailwindBorder ? undefined : props.borderColor,
        transform: props.rotation ? `rotate(${props.rotation}deg)` : undefined,
        ...(props.style ?? {}),
      }}
    >
      {IconBadge}
      {!isLine && (
        <div className="px-3 py-2">
          <div className="text-sm font-medium truncate">{props.label}</div>
        </div>
      )}
    </div>
  );
}


