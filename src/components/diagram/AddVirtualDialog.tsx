import { Diagram, DiagramId, DiagramNode, FlattenedNode, SubDiagram } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../ui/button";

type AddVirtualDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (nodeId: FlattenedNode | null) => void;
    diagrams: Record<DiagramId, Diagram>;
    currentDomain: SubDiagram;
}
export const AddVirtualDialog = ({ isOpen, onClose, onAdd, diagrams, currentDomain }: AddVirtualDialogProps) => {
    const [virtualSearch, setVirtualSearch] = useState<string>("");
    console.log("diagrams", diagrams);


    const flattenAllNodes = useCallback((): FlattenedNode[] => {
        const results: FlattenedNode[] = [];
        const diagramsEntries = Object.entries(diagrams);
        for (const [dId, d] of diagramsEntries) {
            const stack: Array<{ node: DiagramNode; pathIds: string[]; pathLabels: string[] }> = (d.nodes ?? []).map((n) => ({ node: n, pathIds: [], pathLabels: [] }));
            while (stack.length > 0) {
                const { node, pathIds, pathLabels } = stack.pop()!;
                results.push({ nodeId: node.id, label: node.data.label, diagramId: dId, pathIds: [...pathIds, node.id], pathLabels: [...pathLabels, node.data.label], nodeType: node.type });
                if (node.diagram?.nodes?.length) {
                    for (const child of node.diagram.nodes) {
                        stack.push({ node: child, pathIds: [...pathIds, node.id], pathLabels: [...pathLabels, node.data.label] });
                    }
                }
            }
        }
        return results;
    }, [diagrams]);
    const allFlattened = useMemo(() => flattenAllNodes(), [flattenAllNodes]);
    const currentDomainNodeIds = useMemo(() => new Set((currentDomain.nodes ?? []).map((n) => n.id)), [currentDomain.nodes]);
    const filteredFlattened = useMemo(() => {
        const q = virtualSearch.trim().toLowerCase();
        const base = q ? allFlattened.filter((f) => f.label.toLowerCase().includes(q)) : allFlattened;
        // Filter out nodes that are already in the current diagram view
        return base.filter((f) => !currentDomainNodeIds.has(f.nodeId) && f.nodeType !== "virtual" && f.nodeType !== "polyline").slice(0, 200);
    }, [allFlattened, virtualSearch, currentDomainNodeIds]);

    const [virtualSelection, setVirtualSelection] = useState<FlattenedNode | null>(null);

    // --- Global search moved to component ---

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <div className="w-[600px] max-w-[90vw] rounded-md border bg-background shadow-lg">
                <div className="border-b px-3 py-2 text-sm font-medium">Add virtual node</div>
                <div className="p-3 space-y-3">
                    <input
                        className="w-full rounded border px-2 py-1 bg-transparent"
                        placeholder="Search nodes by label..."
                        value={virtualSearch}
                        onChange={(e) => setVirtualSearch(e.target.value)}
                    />
                    <div className="max-h-64 overflow-auto border rounded">
                        <ul>
                            {filteredFlattened.map((item) => {
                                const isSelected = virtualSelection?.nodeId === item.nodeId && virtualSelection.diagramId === item.diagramId;
                                return (
                                    <li key={`${item.diagramId}:${item.nodeId}`}>
                                        <button
                                            className={`w-full text-left px-3 py-2 text-sm ${isSelected ? "bg-accent" : "hover:bg-muted"}`}
                                            onClick={() => setVirtualSelection(item)}
                                        >
                                            <div className="font-medium truncate">{item.label}</div>
                                            <div className="text-xs text-muted-foreground truncate">{item.pathLabels.join(" › ")} {item.pathLabels.length ? "(path)" : ""}</div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button size="sm" disabled={!virtualSelection} onClick={() => onAdd(virtualSelection)}>Add</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}