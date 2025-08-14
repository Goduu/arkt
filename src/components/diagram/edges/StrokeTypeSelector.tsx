import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IoAnalyticsOutline, TbLine } from "@/lib/Icons";
import { Spline } from "lucide-react";
import { ShapeKind } from "./types";

type StrokeTypeSelectorProps = {
    selectedStrokeType: ShapeKind;
    setStrokeType: (strokeType: ShapeKind) => void;
    commit: (partial?: Partial<{ shape: ShapeKind }>) => void;
}


export function StrokeTypeSelector({ selectedStrokeType, setStrokeType, commit }: StrokeTypeSelectorProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Type</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={selectedStrokeType}
                onValueChange={(value) => {
                    if (!value) return;
                    setStrokeType(value as ShapeKind);
                    commit({ shape: value as ShapeKind });
                }}
            >
                <ToggleGroupItem value="straight" aria-label="line">
                    <TbLine className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bezier" aria-label="bezier">
                    <Spline className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="step" aria-label="step">
                    <IoAnalyticsOutline className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}