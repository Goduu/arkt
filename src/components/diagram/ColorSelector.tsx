import { getTailwindBgClass, TAILWIND_MAIN_COLORS } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type ColorSelectorProps = {
    onChange: (color: string) => void;
    value: string;
}
export function ColorSelector({ onChange, value }: ColorSelectorProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Color</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={value}
                onValueChange={onChange}
            >
                {TAILWIND_MAIN_COLORS.map((color) => (
                    <ToggleGroupItem key={color} value={color} aria-label={color}>
                        <div className={`w-4 h-4 rounded-full  ${getTailwindBgClass(color, 500)}`} />
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}