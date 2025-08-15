"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { ArchNodeView } from "@/components/diagram/nodes/ArchNodeView";
import { CreateNodeTemplateDialog } from "@/components/diagram/CreateNodeTemplateDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function TemplatesManagerDialog({ isOpen, onClose }: Props): React.JSX.Element | null {
  const { nodeTemplates } = useAppStore();
  const [query, setQuery] = React.useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = React.useState<boolean>(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setEditId(null);
      setIsCreateOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const list = Object.values(nodeTemplates)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[880px] max-w-[95vw] rounded-md border bg-background shadow-lg">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">Templates</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>New template</Button>
            <Button size="icon" variant="ghost" onClick={onClose}>×</Button>
          </div>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <input
              className="w-full rounded border px-2 py-1 bg-transparent"
              placeholder="Search templates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-auto pr-1">
            {list.map((tpl) => (
              <button
                key={tpl.id}
                className="group rounded-md border hover:border-primary/50 hover:shadow-sm transition text-left bg-card"
                onClick={() => setEditId(tpl.id)}
                title={tpl.name}
              >
                <div className="p-3 border-b">
                  <div className="text-xs font-medium truncate">{tpl.name}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(tpl.updatedAt).toLocaleString()}</div>
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ArchNodeView
                    label={tpl.data.label ?? tpl.name}
                    nodeKind={tpl.type}
                    fillColor={tpl.data.fillColor}
                    textColor={tpl.data.textColor}
                    borderColor={tpl.data.borderColor}
                    iconKey={tpl.data.iconKey}
                    width={typeof tpl.width === "number" ? tpl.width : 180}
                    height={typeof tpl.height === "number" ? tpl.height : 80}
                    rotation={typeof tpl.rotation === "number" ? tpl.rotation : 0}
                    className="bg-background"
                  />
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-12">No templates found.</div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
      {/* Create */}
      <CreateNodeTemplateDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} mode="create" />
      {/* Edit */}
      <CreateNodeTemplateDialog isOpen={Boolean(editId)} onClose={() => setEditId(null)} mode="edit" templateId={editId ?? undefined} />
    </div>
  );
}


