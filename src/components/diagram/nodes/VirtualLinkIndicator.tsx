import { useAppStore } from "@/lib/store";
import { Link as LinkIcon } from "lucide-react";
import { VirtualLink } from "./types";
import { Dispatch, SetStateAction, useState } from "react";

type VirtualLinkIndicatorProps = {
    virtualLinksToThisNode: VirtualLink[];
}

export function VirtualLinkIndicator({ virtualLinksToThisNode }: VirtualLinkIndicatorProps): React.JSX.Element {
    const { setPendingFocus, navigateTo, setDrillStack } = useAppStore();
    const [showLinks, setShowLinks] = useState(false);


    const handleCLick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setShowLinks((v) => !v);
    }

    return (
        <div className="absolute -top-2 -right-2">
            <button
                className="flex cursor-pointer z-30 items-center gap-1 rounded-full bg-blue-600 text-white text-[10px] px-2 py-1 shadow"
                onClick={handleCLick}
                title="Virtual links"
            >
                <LinkIcon className="h-3 w-3" />
                {virtualLinksToThisNode.length}
            </button>
            {showLinks && (
                <div className="absolute right-0 mt-1 w-[260px] max-h-60 overflow-auto rounded-md border bg-background text-foreground text-xs shadow-lg z-10">
                    <div className="px-2 py-1 border-b text-[11px] font-medium">Linked via virtual nodes</div>
                    <ul>
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
                                            // Navigate to the diagram where the connection happens and open its container path
                                            navigateTo(lk.diagramId);
                                            // Set pending focus to the subdiagram where the connection occurs
                                            setPendingFocus({ diagramId: lk.diagramId, containerPathIds: lk.containerPathIds, focusNodeIds: [lk.viaVirtualNodeId, lk.otherEndNodeId] });
                                            setTimeout(() => setDrillStack(lk.containerPathIds), 0);
                                            setShowLinks(false);
                                        }}
                                    >
                                        Open
                                    </button>
                                </div>
                                <div className="mt-1 text-[10px] text-muted-foreground">{lk.direction === "incoming" ? "← Incoming" : lk.direction === "outgoing" ? "Outgoing →" : "Linked"}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}