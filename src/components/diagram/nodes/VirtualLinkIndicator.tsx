import { useAppStore } from "@/lib/store";
import { Link as LinkIcon } from "lucide-react";
import { VirtualLink } from "./types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type VirtualLinkIndicatorProps = {
    virtualLinksToThisNode: VirtualLink[];
    className?: string
}

export function VirtualLinkIndicator({ virtualLinksToThisNode, className }: VirtualLinkIndicatorProps): React.JSX.Element {
    const { setPendingFocus, navigateTo, setDrillStack } = useAppStore();
    const [open, setOpen] = useState(false);

    const lengthTruncated = virtualLinksToThisNode.length > 99 ? "99+" : virtualLinksToThisNode.length

    return (
        <div className={cn("absolute -top-2 -right-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
                    <Button
                        size="icon"
                        variant="outline"
                        className="flex opacity-5 cursor-pointer z-30 p-0 h-4 w-7 gap-0.5 rounded-full text-[6px] shadow"
                        title="Virtual links"
                    >
                        <LinkIcon className="size-2" />
                        {lengthTruncated}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={6} className="w-[260px] p-0 text-xs">
                    <div className="px-2 py-1 border-b text-[11px] font-medium">Linked via virtual nodes</div>
                    <ul className="max-h-60 overflow-auto">
                        {virtualLinksToThisNode.map((lk, idx) => (
                            <li key={`${lk.diagramId}:${idx}`} className="px-2 py-2 border-b last:border-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="truncate">
                                        <div className="font-medium truncate">{lk.otherEndNodeLabel}</div>
                                        <div className="text-muted-foreground truncate">{lk.diagramName}{lk.pathLabels.length ? ` › ${lk.pathLabels.join(" › ")}` : ""}</div>
                                    </div>
                                    <button
                                        className="shrink-0 rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateTo(lk.diagramId);
                                            setPendingFocus({ diagramId: lk.diagramId, containerPathIds: lk.containerPathIds, focusNodeIds: [lk.viaVirtualNodeId, lk.otherEndNodeId] });
                                            setTimeout(() => setDrillStack(lk.containerPathIds), 0);
                                            setOpen(false);
                                        }}
                                    >
                                        Open
                                    </button>
                                </div>
                                <div className="mt-1 text-[10px] text-muted-foreground">{lk.direction === "incoming" ? "← Incoming" : lk.direction === "outgoing" ? "Outgoing →" : "Linked"}</div>
                            </li>
                        ))}
                    </ul>
                </PopoverContent>
            </Popover>
        </div>
    )
}