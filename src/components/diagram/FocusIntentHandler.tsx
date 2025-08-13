import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import {
    useReactFlow as useRFInstance
} from "reactflow";

// ReactFlow child helper that reads pendingFocus from store and focuses the viewport on the target connection
export function FocusIntentHandler(): React.JSX.Element | null {
    const { pendingFocus, setPendingFocus, drillStack } = useAppStore();

    const rf = useRFInstance();
    useEffect(() => {
        if (!pendingFocus) return;
        // Ensure we are at the right nesting
        if (drillStack.join("/") !== pendingFocus.containerPathIds.join("/")) return;

        // Focus strategy: prefer edge, else union of nodes
        const focusNodeIds = pendingFocus.focusNodeIds ?? [];
        try {
            if (focusNodeIds.length > 0) {
                const nodesToFit = rf.getNodes().filter((n) => focusNodeIds.includes(n.id));
                if (nodesToFit.length > 0) {
                    rf.fitView({ nodes: nodesToFit, padding: 0.25, includeHiddenNodes: true, minZoom: 0.3, maxZoom: 1.5 });
                } else {
                    rf.fitView({ padding: 0.25 });
                }
            } else {
                rf.fitView({ padding: 0.25 });
            }
        } finally {
            // Clear once applied
            setPendingFocus(null);
        }
    }, [pendingFocus, rf, setPendingFocus, drillStack]);
    return null;
}
