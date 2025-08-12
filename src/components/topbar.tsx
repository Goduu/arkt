"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Plus } from "lucide-react";

export function Topbar() {
  const { currentId, diagrams, rootId, navigateTo, createDiagram } = useAppStore();
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
      </nav>
      <div className="ml-auto">
        <Button size="sm" onClick={onNewChild}>
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </div>
    </div>
  );
}


