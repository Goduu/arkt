import { getTailwindBgClass, TAILWIND_MAIN_COLORS, TailwindBgFamily } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type ColorSelectorProps = {
    label?: string;
    onChange: (color: string) => void;
    value: string;
    options?: string[];
}
export function ColorSelector({ label, onChange, value, options = TAILWIND_MAIN_COLORS }: ColorSelectorProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">{label ?? "Color"}</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={value}
                onValueChange={onChange}
            >
                {options.map((color) => (
                    <ToggleGroupItem key={color} value={color} aria-label={color}>
                        <div className={`w-4 h-4 rounded-full border border-slate-200  ${getTailwindBgClass(color as TailwindBgFamily, 500)}`} />
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}