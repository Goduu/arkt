"use client";

import Link from "next/link";
import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Plus, Download, Upload, CornerUpLeft } from "lucide-react";

export function Topbar() {
  const { currentId, diagrams, rootId, navigateTo, createDiagram, drillStack, setDrillStack, setPendingCommand } = useAppStore();
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

  const fileRef = React.useRef<HTMLInputElement>(null);
  const onImportClick = (): void => fileRef.current?.click();
  const onImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      setPendingCommand({ type: "import", data: parsed });
    } catch {
      // ignore invalid file
    } finally {
      // reset value so selecting the same file again triggers onChange
      e.currentTarget.value = "";
    }
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
        {/* back button */}
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
            <span className="ml-4">
              <Button size="sm" variant="outline" onClick={() => setPendingCommand({ type: "back" })}>
                <CornerUpLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </span>
          </>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
        <Button size="sm" variant="outline" onClick={onImportClick}>
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPendingCommand({ type: "export" })}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <Button size="sm" onClick={() => setPendingCommand({ type: "save" })}>Save</Button>
        <Button size="sm" onClick={onNewChild}>
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </div>
    </div>
  );
}


