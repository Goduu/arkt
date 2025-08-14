"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Plus } from "lucide-react";
import { getIconByKey } from "@/lib/iconRegistry";
import { cn, getTailwindBgClass } from "@/lib/utils";

export function Topbar() {
  const { currentId, diagrams, rootId, navigateTo, createDiagram, drillStack, setDrillStack, nodeTemplates, setPendingSpawn } = useAppStore();
  const segments: string[] = [];

  let cursor = currentId;
  while (cursor) {
    const d = diagrams[cursor];
    if (!d) break;
    segments.unshift(cursor);
    if (d.parentId) cursor = d.parentId; else break;
  }

  const onNewChild = (): void => {
    const id = createDiagram("New Diagram", currentId);
    navigateTo(id);
  };

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <Link href="#" onClick={() => navigateTo(rootId)} className="inline-flex items-center gap-2 text-sm font-medium">
        <Home size={16} /> Root
      </Link>
      <ChevronRight size={14} className="text-muted-foreground" />
      <nav className="flex items-center gap-1 overflow-x-auto">
        {segments.map((id, idx) => {
          const d = diagrams[id];
          const isLast = idx === segments.length - 1;
          return (
            <div key={id} className="flex items-center">
              <button
                className={"text-sm font-medium hover:underline" + (isLast ? " text-foreground" : " text-muted-foreground")}
                onClick={() => navigateTo(id)}
              >
                {d?.name ?? "Unknown"}
              </button>
              {!isLast && <ChevronRight size={14} className="text-muted-foreground mx-1" />}
            </div>
          );
        })}
        {drillStack.length > 0 && (
          <>
            <ChevronRight size={14} className="text-muted-foreground" />
            {(() => {
              // Build labels for in-diagram path
              const labels: string[] = [];
              let subNodes = diagrams[currentId]?.nodes ?? [];
              for (const nid of drillStack) {
                const found = subNodes.find((n) => n.id === nid);
                labels.push(found?.data.label ?? "Node");
                subNodes = found?.diagram?.nodes ?? [];
              }
              return labels.map((label, idx) => {
                const isLast = idx === labels.length - 1;
                return (
                  <div key={`${label}-${idx}`} className="flex items-center">
                    <button
                      className={"text-sm font-medium hover:underline" + (isLast ? " text-foreground" : " text-muted-foreground")}
                      onClick={() => setDrillStack(drillStack.slice(0, idx + 1))}
                    >
                      {label}
                    </button>
                    {!isLast && <ChevronRight size={14} className="text-muted-foreground mx-1" />}
                  </div>
                );
              });
            })()}
          </>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {Object.values(nodeTemplates).map((tpl) => {
          const def = getIconByKey(tpl.data.iconKey);
          const I = def?.Icon;
          return (
            <Button key={tpl.id} size="sm" variant="outline" onClick={() => setPendingSpawn({ templateId: tpl.id })} title={tpl.name} className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  tpl.type === "ellipse" ? "rounded-full" : "rounded-sm",
                  "border w-3.5 h-3.5",
                  typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-") ? tpl.data.fillColor : "",
                  typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-") ? tpl.data.borderColor : "",
                )}
                style={{
                  backgroundColor:
                    typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-")
                      ? undefined
                      : (tpl.data.fillColor as string | undefined),
                  borderColor:
                    typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-")
                      ? undefined
                      : (tpl.data.borderColor as string | undefined),
                }}
              ></span>
              {I ? <I className="h-4 w-4" /> : null}
              <span className="hidden sm:inline text-xs">{tpl.name}</span>
            </Button>
          );
        })}
        <Button size="sm" onClick={onNewChild}>
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </div>
    </div>
  );
}


