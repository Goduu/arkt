// Collect connections coming from virtual nodes that reference THIS node (when we're rendering an original node)
export type VirtualLink = {
    diagramId: string;
    diagramName: string;
    containerPathIds: string[]; // path to the subdiagram where the connection happens
    nodePathIds: string[]; // path including the virtual node id
    pathLabels: string[]; // labels along nodePathIds (includes virtual node label at end)
    viaVirtualNodeId: string;
    otherEndNodeId: string;
    otherEndNodeLabel: string;
    direction: "incoming" | "outgoing" | "undirected";
};