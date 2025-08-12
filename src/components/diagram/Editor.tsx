"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import type { Diagram, DiagramEdge, DiagramNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusSquare, Type, Square, Link as LinkIcon, Ellipsis } from "lucide-react";
import { nanoid } from "nanoid";

// Excalidraw is large; load dynamically on client only
const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, { ssr: false });

export function Editor() {
  const { diagrams, currentId, addNode, addEdge, navigateTo, createDiagram, updateNode } = useAppStore();
  const diagram: Diagram | undefined = diagrams[currentId];

  // Note: Excalidraw ref typing causes an issue with dynamic import; omit for now
  // const excalidrawRef = React.useRef<any>(null);

  const handleAdd = (type: DiagramNode["type"]) => {
    if (!diagram) return;
    const position = { x: 200, y: 200 };
    const base = {
      position,
      width: 200,
      height: 80,
      rotation: 0,
      data: { label: type.toUpperCase() },
      diagram: { nodes: [], edges: [] },
    } satisfies Omit<DiagramNode, "id" | "type">;
    addNode(diagram.id, { ...base, type });
  };

  const handleMakeChildDiagram = (nodeId: string) => {
    if (!diagram) return;
    const node = diagram.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.data.childDiagramId) {
      navigateTo(node.data.childDiagramId);
      return;
    }
    const childId = createDiagram(node.data.label || "Detail", diagram.id);
    updateNode(diagram.id, { ...node, data: { ...node.data, childDiagramId: childId } });
    navigateTo(childId);
  };

  const handleLinkSelected = () => {
    if (!diagram) return;
    const [a, b] = diagram.nodes.slice(-2);
    if (!a || !b) return;
    const newEdge: Omit<DiagramEdge, "id"> = {
      source: a.id,
      target: b.id,
      type: "bezier",
      label: { text: "relation" },
    };
    addEdge(diagram.id, newEdge);
  };

  // Minimal canvas holder; Excalidraw will render and users can draw freely
  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-2 border-b p-2">
        <Button size="sm" onClick={() => handleAdd("rectangle")}> <Square className="mr-2 h-4 w-4" /> Rectangle</Button>
        <Button size="sm" onClick={() => handleAdd("ellipse")}> <Ellipsis className="mr-2 h-4 w-4" /> Ellipse</Button>
        <Button size="sm" onClick={() => handleAdd("text")}> <Type className="mr-2 h-4 w-4" /> Text</Button>
        <Button size="sm" variant="outline" onClick={handleLinkSelected}> <LinkIcon className="mr-2 h-4 w-4" /> Link last 2</Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Tip: click a node in list below to open its sub-diagram
        </div>
      </div>
      <div className="grid grid-cols-12 flex-1 min-h-0">
        <div className="col-span-9 min-h-0">
          <div className="h-full">
            <Excalidraw />
          </div>
        </div>
        <div className="col-span-3 border-l h-full overflow-auto">
          <div className="p-3">
            <h3 className="font-semibold mb-2">Elements</h3>
            <ul className="space-y-2">
              {diagram?.nodes.map((n) => (
                <li key={n.id} className="flex items-center justify-between rounded border p-2">
                  <div className="truncate">
                    <div className="text-sm font-medium">{n.data.label}</div>
                    <div className="text-xs text-muted-foreground">{n.type}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleMakeChildDiagram(n.id)}>
                    <PlusSquare className="mr-1 h-4 w-4" /> Open
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


