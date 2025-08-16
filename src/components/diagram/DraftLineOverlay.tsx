import { DiagramPolylinePoint } from "@/lib/types";
import { cn } from "@/lib/utils";

type DraftLineOverlayProps = {
    viewport: { x: number; y: number; zoom: number };
    isDrawingLine: boolean;
    draftPoints: DiagramPolylinePoint[];
}

export const DraftLineOverlay = ({ viewport, isDrawingLine, draftPoints }: DraftLineOverlayProps) => {
    return (
        <svg className={cn("absolute inset-0 z-40", "pointer-events-none")} width="100%" height="100%">
            <g transform={`matrix(${viewport.zoom},0,0,${viewport.zoom},${viewport.x},${viewport.y})`}>
                {isDrawingLine && draftPoints.length >= 2 && (
                    <polyline
                        points={draftPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                    />
                )}
            </g>
        </svg>
    );
};