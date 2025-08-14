import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IoAnalyticsOutline, TbLine } from "@/lib/Icons";
import { Spline } from "lucide-react";
import { ShapeKind } from "./types";

type StrokeTypeSelectorProps = {
    selectedWidth: number;
    setStrokeWidth: (width: number) => void;
    commit: (partial?: Partial<{ strokeWidth: number }>) => void;
}


export function StrokeWidth({ selectedWidth, setStrokeWidth, commit }: StrokeTypeSelectorProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Stroke width</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={selectedWidth.toString()}
                onValueChange={(value:string) => {
                    if (!value) return;
                    setStrokeWidth(Number(value));
                    commit({ strokeWidth: Number(value) });
                }}
            >
                <ToggleGroupItem value="2" aria-label="line">
                    <div className="w-3 h-0.5 bg-black rounded-xl"/>
                </ToggleGroupItem>
                <ToggleGroupItem value="3" aria-label="bezier">
                    <div className="w-3 h-1 bg-black rounded-xl"/>
                </ToggleGroupItem>
                <ToggleGroupItem value="4" aria-label="step">
                    <div className="w-3 h-1.5 bg-black rounded-xl"/>
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}