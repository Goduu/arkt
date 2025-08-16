import { Button } from "../../ui/button";
import { StrokeWidth } from "../edges/StrokeWidth";

type LineNodeControlsProps = {
    lineStrokeColor: string;
    lineStrokeWidth: number;
    onClose: () => void;
    commitLine: (partial?: Partial<{ strokeColor: string; strokeWidth: number }>) => void;
    setLineStrokeColor: (color: string) => void;
    setLineStrokeWidth: (width: number) => void;
}
export const LineNodeControls = ({ lineStrokeColor, lineStrokeWidth, onClose, commitLine, setLineStrokeColor, setLineStrokeWidth }: LineNodeControlsProps) => {
    return (
        <div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">Stroke color</label>
                <input
                    type="color"
                    className="size-6 m-2 rounded border"
                    value={lineStrokeColor}
                    onChange={(e) => {
                        const v = e.target.value;
                        setLineStrokeColor(v);
                        commitLine({ strokeColor: v });
                    }}
                />
            </div>
            <div>
                <StrokeWidth
                    selectedWidth={lineStrokeWidth}
                    setStrokeWidth={(w) => setLineStrokeWidth(w)}
                    commit={(p) => commitLine({ strokeWidth: Number(p?.strokeWidth ?? lineStrokeWidth) })}
                />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={() => commitLine()}>Apply</Button>
            </div>
        </div>
    );
};