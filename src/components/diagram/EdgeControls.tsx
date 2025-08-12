"use client";

import * as React from "react";
import type { Edge as RFEdge } from "reactflow";
import { Button } from "@/components/ui/button";
import { ChevronsLeftRight, ArrowLeftRight, ChevronsRight } from "lucide-react";

type Props = {
  selectedEdge: RFEdge | null;
  onChange: (edge: RFEdge) => void;
};

export function EdgeControls({ selectedEdge, onChange }: Props) {
  if (!selectedEdge) return null;

  const toggleStart = () => {
    const next: RFEdge = {
      ...selectedEdge,
      markerStart: selectedEdge.markerStart ? undefined : { type: 3 },
    } as RFEdge;
    onChange(next);
  };
  const toggleEnd = () => {
    const next: RFEdge = {
      ...selectedEdge,
      markerEnd: selectedEdge.markerEnd ? undefined : { type: 3 },
    } as RFEdge;
    onChange(next);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-background border shadow rounded-md px-3 py-2 flex items-center gap-2">
      <span className="text-sm mr-2">Edge arrows:</span>
      <Button size="sm" variant="outline" onClick={toggleStart}><ChevronsLeftRight className="mr-2 h-4 w-4" /> Start</Button>
      <Button size="sm" variant="outline" onClick={toggleEnd}><ChevronsRight className="mr-2 h-4 w-4" /> End</Button>
    </div>
  );
}


