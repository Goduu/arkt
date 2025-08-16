import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FontSizeSelectorProps = {
    selectedFontSize: number;
    setFontSize: (fontSize: number) => void;
    commit: (partial?: Partial<{ fontSize: number }>) => void;
}

export function FontSizeSelector({ selectedFontSize, setFontSize, commit }: FontSizeSelectorProps) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">Font Size</label>
            <ToggleGroup
                variant="outline"
                type="single"
                value={selectedFontSize.toString()}
                onValueChange={(value) => {
                    if (!value) return;
                    setFontSize(Number(value));
                    commit({ fontSize: Number(value) });
                }}
            >
                <ToggleGroupItem value="10" aria-label="10">
                    S
                </ToggleGroupItem>
                <ToggleGroupItem value="15" aria-label="20">
                    M
                </ToggleGroupItem>
                <ToggleGroupItem value="20" aria-label="30">
                    L
                </ToggleGroupItem>
                <ToggleGroupItem value="30" aria-label="30">
                    XL
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}