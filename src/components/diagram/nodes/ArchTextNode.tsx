"use client";

import * as React from "react";
import type { NodeProps } from "reactflow";
import { Handle, NodeToolbar, Position, useReactFlow } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";
import { useAppStore } from "@/lib/store";
import type { DiagramNode } from "@/lib/types";
import { getIconByKey } from "@/lib/iconRegistry";
import { cn, getTailwindTextClass, TAILWIND_TEXT_COLORS, TailwindBgFamily } from "@/lib/utils";
import { AutoWidthInput } from "@/components/ui/auto-width-input";

export type ArchTextNodeData = {
    label: string;
    fillColor?: string;
    textColor?: string;
    borderColor?: string;
    iconKey?: string;
    rotation?: number;
    onLabelCommit?: (newLabel: string) => void;
};

export function ArchTextNode(props: NodeProps<ArchTextNodeData>): React.JSX.Element {
    const { id } = props;
    const { diagrams, currentId, updateNode, renameDiagram } = useAppStore();
    const diagram = diagrams[currentId];
    const domainNode: DiagramNode | undefined = diagram?.nodes.find((n) => n.id === id);
    const [value, setValue] = React.useState<string>(props.data.label);
    const [isEditing, setIsEditing] = React.useState<boolean>(false);
    const rf = useReactFlow();

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const outerRef = React.useRef<HTMLDivElement | null>(null);
    const paddingWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const inputMeasureRef = React.useRef<HTMLSpanElement | null>(null);
    const beforeEditValueRef = React.useRef<string>(props.data.label);

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
    const textColor = props.data.textColor ?? undefined;
    const iconKey = props.data.iconKey ?? undefined;
    const rotation = props.data.rotation ?? 0;
    const border = props.data.borderColor ?? undefined;

    const isTailwindBg = typeof fill === "string" && fill.startsWith("bg-");
    const isTailwindText = typeof textColor === "string" && textColor.startsWith("text-");
    const isTailwindBorder = typeof border === "string" && border.startsWith("border-");
    const backgroundStyle = isTailwindBg ? undefined : fill;

    // Robust auto-size: measure content + padding + borders, then set RF node size
    React.useLayoutEffect(() => {
        // Avoid RF node updates while editing to prevent focus/blur churn
        if (isEditing) return;
        const outerEl = outerRef.current;
        const paddingEl = paddingWrapperRef.current;
        const measurer = inputMeasureRef.current;
        if (!outerEl || !paddingEl || !measurer) return;

        measurer.textContent = value && value.length > 0 ? value : " ";

        const paddingStyles = window.getComputedStyle(paddingEl);
        const outerStyles = window.getComputedStyle(outerEl);
        const paddingX = parseFloat(paddingStyles.paddingLeft) + parseFloat(paddingStyles.paddingRight);
        const paddingY = parseFloat(paddingStyles.paddingTop) + parseFloat(paddingStyles.paddingBottom);
        const borderX = parseFloat(outerStyles.borderLeftWidth) + parseFloat(outerStyles.borderRightWidth);
        const borderY = parseFloat(outerStyles.borderTopWidth) + parseFloat(outerStyles.borderBottomWidth);

        const textWidth = Math.ceil(measurer.offsetWidth);
        const textHeight = Math.ceil(measurer.offsetHeight);

        const nextWidth = Math.max(1, textWidth + paddingX + borderX);
        const nextHeight = Math.max(1, textHeight + paddingY + borderY);

        const current = rf.getNode(id);
        const currentWidth = (current?.style as any)?.width as number | undefined;
        const currentHeight = (current?.style as any)?.height as number | undefined;
        if (currentWidth === nextWidth && currentHeight === nextHeight) return;

        rf.setNodes((prev) =>
            prev.map((n) =>
                n.id === id
                    ? {
                        ...n,
                        style: { ...(n.style ?? {}), width: nextWidth, height: nextHeight },
                    }
                    : n
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, value, isEditing]);

    return (
        <div
            ref={outerRef}
            className={cn(
                "group relative rounded-md",
                isTailwindBg ? String(fill) : "",
                isTailwindText ? String(textColor) : "",
                isTailwindBorder ? String(border) : "",
                "inline-block select-none"
            )}
            style={{
                backgroundColor: backgroundStyle,
                color: isTailwindText ? undefined : textColor,
                borderColor: isTailwindBorder ? undefined : border,
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                beforeEditValueRef.current = value;
                setIsEditing(true);
                requestAnimationFrame(() => {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                });
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


            <div className={cn(props.selected ? "border border-violet-500" : "")} ref={paddingWrapperRef}>
                <AutoWidthInput
                    className={cn(
                        "bg-transparent outline-none text-sm font-medium",
                        isEditing ? "w-auto nodrag nowheel pointer-events-auto" : "w-auto pointer-events-none",
                        isTailwindText ? String(textColor) : "",
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
                    onPointerDown={(e) => { if (isEditing) e.stopPropagation(); }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (isEditing) {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                setValue(beforeEditValueRef.current);
                                (e.target as HTMLInputElement).blur();
                            }
                        }
                    }}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const next = e.target.value;
                        setValue(next);
                    }}
                    onBlur={() => {
                        if (isEditing) {
                            setIsEditing(false);
                        }
                        onBlur();
                    }}
                    readOnly={!isEditing}
                    spellCheck={false}
                />
                {/* Hidden measurer for auto-size */}
                <span
                    ref={inputMeasureRef}
                    className="fixed -left-[10000px] -top-[10000px] whitespace-pre text-sm font-medium"
                    aria-hidden="true"
                />
            </div>
            <Handle className="hidden group-hover:block" type="source" position={Position.Right} />
            <Handle className="hidden group-hover:block" type="target" position={Position.Left} />
        </div>
    );
}


