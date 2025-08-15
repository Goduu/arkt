import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { DiagramNode, FlattenedNode } from "@/lib/types";
import { Link as LinkIcon, Square } from "lucide-react";

export const GlobalSearch: React.FC<{ ensureSyncedThen?: (after: () => void) => void }> = ({ ensureSyncedThen }) => {
  const { diagrams, currentId, navigateTo, setDrillStack, setPendingFocus } = useAppStore();
  const [globalSearch, setGlobalSearch] = React.useState<string>("");

  const allFlattened = React.useMemo(() => {
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

  const globalResults = React.useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [] as FlattenedNode[];
    return allFlattened
      .filter((f) => f.label.toLowerCase().includes(q) || f.pathLabels.some((p) => p.toLowerCase().includes(q)))
      .slice(0, 200);
  }, [allFlattened, globalSearch]);

  const handleGoToSearchItem = React.useCallback((item: FlattenedNode) => {
    const after = () => {
      if (currentId !== item.diagramId) navigateTo(item.diagramId);
      setDrillStack(item.pathIds);
      setPendingFocus({ diagramId: item.diagramId, containerPathIds: item.pathIds, focusNodeIds: [item.nodeId] });
    };
    if (ensureSyncedThen) ensureSyncedThen(after);
    else after();
    setGlobalSearch("");
  }, [currentId, navigateTo, setDrillStack, setPendingFocus, ensureSyncedThen]);

  return (
    <div className="border-b p-2 gap-2 flex flex-col">
      <div className="relative max-w-xl">
        <input
          className="w-full rounded border px-2 py-1 bg-transparent"
          placeholder="Search nodes across all diagrams..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        {globalSearch && globalResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full border rounded bg-background max-h-64 overflow-auto shadow">
            <ul>
              {globalResults.map((item) => {
                const isVirtual = item.nodeType === "virtual";
                return (
                  <li key={`${item.diagramId}:${item.nodeId}`}>
                    <button
                      className="w-full px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => handleGoToSearchItem(item)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.pathLabels.join(" › ")} {item.pathLabels.length ? "(path)" : ""}</div>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isVirtual ? (
                            <LinkIcon className="h-3.5 w-3.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};