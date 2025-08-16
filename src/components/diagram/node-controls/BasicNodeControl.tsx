import { ColorSelector } from "@/components/diagram/ColorSelector";
import { Button } from "@/components/ui/button";
import { ArchNodeView } from "@/components/diagram/nodes/ArchNodeView";
import { Dispatch, FC, SetStateAction } from "react";

type BasicNodeControlProps = {
    label: string;
    setLabel: Dispatch<SetStateAction<string>>;
    description: string;
    setDescription: Dispatch<SetStateAction<string>>;
    fillColor: string;
    setFillColor: Dispatch<SetStateAction<string>>;
    textColor: string;
    setTextColor: Dispatch<SetStateAction<string>>;
    borderColor: string;
    setBorderColor: Dispatch<SetStateAction<string>>;
    iconKey?: string;
    nodeKind: string;
    rotation: number;
    width: number;
    height: number;
    setWidth: Dispatch<SetStateAction<number>>;
    setHeight: Dispatch<SetStateAction<number>>;
    commit: (partial?: Partial<{ label: string; description: string; fillColor: string; textColor: string; borderColor: string; iconKey?: string; nodeKind: string; rotation: number; width: number; height: number }>) => void;
    onClose: () => void;
};

export const BasicNodeControl: FC<BasicNodeControlProps> = ({
    label,
    setLabel,
    description,
    setDescription,
    fillColor,
    setFillColor,
    textColor,
    setTextColor,
    borderColor,
    setBorderColor,
    iconKey,
    nodeKind,
    rotation,
    width,
    height,
    setWidth,
    setHeight,
    commit,
    onClose,
}) => {
    return (
        <>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Label</label>
                <input
                    className="w-full rounded border px-2 py-1 bg-transparent"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={() => commit()}
                />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                <textarea
                    className="w-full rounded border px-2 py-1 bg-transparent resize-none"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => commit()}
                />
            </div>
            <div className="flex gap-2 flex-wrap">
                <div>
                    <ColorSelector
                        label="Fill color"
                        value={fillColor}
                        onChange={(next) => { setFillColor(next); commit({ fillColor: next }); }}
                    />
                </div>
                <div>
                    <ColorSelector
                        label="Text color"
                        value={textColor}
                        onChange={(next) => { setTextColor(next); commit({ textColor: next }); }}
                    />
                </div>
            </div>
            <div>
                <ColorSelector
                    label="Border color"
                    value={borderColor}
                    onChange={(next) => { setBorderColor(next); commit({ borderColor: next }); }}
                />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Preview</label>
                <div className="border rounded-md p-2 grid place-items-center">
                    <ArchNodeView
                        label={label || "Node"}
                        nodeKind={nodeKind}
                        fillColor={fillColor}
                        textColor={textColor}
                        borderColor={borderColor}
                        iconKey={iconKey}
                        rotation={rotation}
                        width={Math.max(120, Math.min(320, width))}
                        height={Math.max(60, Math.min(240, height))}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Width</label>
                    <input
                        type="number"
                        min={nodeKind === "line" ? 20 : 40}
                        className="w-full rounded border px-2 py-1 bg-transparent"
                        value={width}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setWidth(val);
                            if (nodeKind === "square") setHeight(val);
                        }}
                        onBlur={() => commit()}
                    />
                </div>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">Height</label>
                    <input
                        type="number"
                        min={nodeKind === "line" ? 2 : 24}
                        className="w-full rounded border px-2 py-1 bg-transparent"
                        value={height}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setHeight(val);
                            if (nodeKind === "square") setWidth(val);
                        }}
                        onBlur={() => commit()}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={() => commit()}>Apply</Button>
            </div>
        </>
    );
};