import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TbLineDashed } from "@/lib/Icons";

type StrokeTypeProps = {
    value: string,
    onChange: (type: string) => void
}

export const StrokeType = ({ value, onChange }: StrokeTypeProps) => {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Type</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={value}
                onValueChange={onChange}
            >
                <ToggleGroupItem value="dashed" aria-label="dashed">
                    <TbLineDashed className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>

        </div>
    )
}