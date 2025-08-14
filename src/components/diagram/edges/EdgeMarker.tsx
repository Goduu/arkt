import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TbLineDashed } from "@/lib/Icons";
import { MoveHorizontal, MoveLeft, MoveRight } from "lucide-react";

type EdgeMarkerProps = {
    value: string,
    onChange: (type: string) => void
}

export const EdgeMarker = ({ value, onChange }: EdgeMarkerProps) => {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Direction</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={value}
                onValueChange={onChange}
            >
                <ToggleGroupItem value="unidirectional" aria-label="unidirectional">
                    <MoveRight className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bidirectional" aria-label="bidirectional">
                    <MoveHorizontal className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>

        </div>
    )
}