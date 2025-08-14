"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconSelector } from "@/components/diagram/IconSelector";
import { ColorSelector } from "@/components/diagram/ColorSelectorO";
import { useAppStore } from "@/lib/store";
import type { DiagramNode } from "@/lib/types";
import { ArchNodeView } from "@/components/diagram/nodes/ArchNodeView";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateNodeTemplateDialog({ isOpen, onClose }: Props): React.JSX.Element | null {
  const { createNodeTemplate } = useAppStore();
  const [name, setName] = React.useState<string>("");
  const [nodeKind, setNodeKind] = React.useState<DiagramNode["type"]>("rectangle");
  const [width, setWidth] = React.useState<number>(180);
  const [height, setHeight] = React.useState<number>(80);
  const [rotation, setRotation] = React.useState<number>(0);
  const [fillColor, setFillColor] = React.useState<string>("bg-blue-500");
  const [textColor, setTextColor] = React.useState<string>("text-blue-900");
  const [iconKey, setIconKey] = React.useState<string | undefined>(undefined);
  const [borderColor, setBorderColor] = React.useState<string>("border-slate-300");

  const previewStyle = React.useMemo(() => {
    const isTailwindBg = typeof fillColor === "string" && fillColor.startsWith("bg-");
    const isTailwindText = typeof textColor === "string" && textColor.startsWith("text-");
    return { isTailwindBg, isTailwindText };
  }, [fillColor, textColor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[720px] max-w-[90vw] rounded-md border bg-background shadow-lg">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">Create node</div>
          <Button size="icon" variant="ghost" onClick={onClose}>×</Button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 text-sm">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Name</label>
              <input className="w-full rounded border px-2 py-1 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select className="w-full rounded border px-2 py-1 bg-transparent" value={nodeKind} onChange={(e) => setNodeKind(e.target.value as DiagramNode["type"]) }>
                <option value="rectangle">Rectangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="text">Text</option>
                <option value="container">Container</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorSelector label="Fill color" value={fillColor} onChange={setFillColor} />
              <ColorSelector label="Text color" mode="text" value={textColor} onChange={setTextColor} />
            </div>
            <IconSelector label="Icon" value={iconKey} onChange={setIconKey} />
            <ColorSelector label="Border color" mode="border" value={borderColor} onChange={setBorderColor} />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Width</label>
                <input type="number" min={60} className="w-full rounded border px-2 py-1 bg-transparent" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Height</label>
                <input type="number" min={40} className="w-full rounded border px-2 py-1 bg-transparent" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rotation</label>
                <input type="number" min={-180} max={180} className="w-full rounded border px-2 py-1 bg-transparent" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">Preview</div>
            <div className="flex items-center justify-center p-6">
              <ArchNodeView
                label={name || "Node"}
                nodeKind={nodeKind}
                fillColor={fillColor}
                textColor={textColor}
                borderColor={borderColor}
                iconKey={iconKey}
                rotation={rotation}
                width={width}
                height={height}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const id = createNodeTemplate({
                  name: name || "Node",
                  type: nodeKind,
                  width,
                  height,
                  rotation,
                  data: { label: name || "Node", fillColor, textColor, borderColor, iconKey },
                });
                if (id) onClose();
              }}>Create</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


