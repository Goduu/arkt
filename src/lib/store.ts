"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { AppStateSnapshot, Diagram, DiagramEdge, DiagramId, DiagramMeta, DiagramNode } from "./types";

export interface AppStoreState {
  diagrams: Record<DiagramId, Diagram>;
  rootId: DiagramId;
  currentId: DiagramId;
  drillStack: string[]; // path of node ids inside the current diagram
  // transient UI intents
  pendingFocus: null | { diagramId: DiagramId; containerPathIds: string[]; focusNodeIds?: string[]; focusEdgeId?: string };
  // actions
  createDiagram: (name: string, parentId?: DiagramId) => DiagramId;
  renameDiagram: (id: DiagramId, name: string) => void;
  deleteDiagram: (id: DiagramId) => void;
  navigateTo: (id: DiagramId) => void;
  setDrillStack: (stack: string[]) => void;
  pushDrill: (nodeId: string) => void;
  popDrill: () => void;
  clearDrillStack: () => void;
  setPendingFocus: (focus: AppStoreState["pendingFocus"]) => void;
  addNode: (diagramId: DiagramId, node: Omit<DiagramNode, "id">) => string;
  updateNode: (diagramId: DiagramId, node: DiagramNode) => void;
  removeNode: (diagramId: DiagramId, nodeId: string) => void;
  addEdge: (diagramId: DiagramId, edge: Omit<DiagramEdge, "id">) => string;
  updateEdge: (diagramId: DiagramId, edge: DiagramEdge) => void;
  removeEdge: (diagramId: DiagramId, edgeId: string) => void;
  setNodesEdges: (diagramId: DiagramId, nodes: DiagramNode[], edges: DiagramEdge[]) => void;
  exportSnapshot: () => AppStateSnapshot;
  importSnapshot: (snapshot: AppStateSnapshot) => void;
}

const now = () => Date.now();

function createDiagramMeta(name: string, parentId?: DiagramId): DiagramMeta {
  return {
    id: nanoid(),
    name,
    parentId,
    createdAt: now(),
    updatedAt: now(),
  };
}

function createEmptyDiagram(name: string, parentId?: DiagramId): Diagram {
  const meta = createDiagramMeta(name, parentId);
  return { ...meta, nodes: [], edges: [] };
}

const initialRoot = createEmptyDiagram("System");

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      diagrams: { [initialRoot.id]: initialRoot },
      rootId: initialRoot.id,
      currentId: initialRoot.id,
      drillStack: [],
      pendingFocus: null,

  createDiagram: (name: string, parentId?: DiagramId) => {
    const diagram = createEmptyDiagram(name, parentId);
    set((state) => ({
      diagrams: { ...state.diagrams, [diagram.id]: diagram },
    }));
    return diagram.id;
  },

  renameDiagram: (id: DiagramId, name: string) => {
    set((state) => {
      const target = state.diagrams[id];
      if (!target) return {} as AppStoreState;
      const updated: Diagram = { ...target, name, updatedAt: now() };
      return { diagrams: { ...state.diagrams, [id]: updated } };
    });
  },

  deleteDiagram: (id: DiagramId) => {
    set((state) => {
      const clone = { ...state.diagrams };
      delete clone[id];
      let nextCurrent = state.currentId;
      if (nextCurrent === id) {
        nextCurrent = state.rootId;
      }
      return { diagrams: clone, currentId: nextCurrent };
    });
  },

  navigateTo: (id: DiagramId) => set({ currentId: id, drillStack: [] }),

  setDrillStack: (stack: string[]) => set({ drillStack: stack }),
  pushDrill: (nodeId: string) => set((state) => ({ drillStack: [...state.drillStack, nodeId] })),
  popDrill: () => set((state) => ({ drillStack: state.drillStack.slice(0, -1) })),
  clearDrillStack: () => set({ drillStack: [] }),

  setPendingFocus: (focus) => set({ pendingFocus: focus }),

  addNode: (diagramId: DiagramId, node: Omit<DiagramNode, "id">) => {
    const id = nanoid();
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        nodes: [
          ...d.nodes,
          { ...node, id, diagram: node.diagram ?? { nodes: [], edges: [] } },
        ],
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
    return id;
  },

  updateNode: (diagramId: DiagramId, node: DiagramNode) => {
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        nodes: d.nodes.map((n) => (n.id === node.id ? node : n)),
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
  },

  removeNode: (diagramId: DiagramId, nodeId: string) => {
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        nodes: d.nodes.filter((n) => n.id !== nodeId),
        edges: d.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
  },

  addEdge: (diagramId: DiagramId, edge: Omit<DiagramEdge, "id">) => {
    const id = nanoid();
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        edges: [...d.edges, { ...edge, id }],
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
    return id;
  },

  updateEdge: (diagramId: DiagramId, edge: DiagramEdge) => {
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        edges: d.edges.map((e) => (e.id === edge.id ? edge : e)),
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
  },

  removeEdge: (diagramId: DiagramId, edgeId: string) => {
    set((state) => {
      const d = state.diagrams[diagramId];
      if (!d) return {} as AppStoreState;
      const updated: Diagram = {
        ...d,
        edges: d.edges.filter((e) => e.id !== edgeId),
        updatedAt: now(),
      };
      return { diagrams: { ...state.diagrams, [diagramId]: updated } };
    });
  },

      setNodesEdges: (diagramId, nodes, edges) => {
        set((state) => {
          const d = state.diagrams[diagramId];
          if (!d) return {} as AppStoreState;
          // Ensure every node has a diagram structure
          const normalizedNodes: DiagramNode[] = nodes.map((n) => ({
            ...n,
            diagram: n.diagram ?? { nodes: [], edges: [] },
          }));
          const updated: Diagram = { ...d, nodes: normalizedNodes, edges, updatedAt: now() };
          return { diagrams: { ...state.diagrams, [diagramId]: updated } };
        });
      },

      exportSnapshot: () => {
        const state = get();
        const snapshot: AppStateSnapshot = {
          diagrams: state.diagrams,
          rootId: state.rootId,
        };
        return snapshot;
      },

      importSnapshot: (snapshot: AppStateSnapshot) => {
        set({
          diagrams: snapshot.diagrams,
          rootId: snapshot.rootId,
          currentId: snapshot.rootId,
        });
      },
    }),
    {
      name: "archkt-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ diagrams: state.diagrams, rootId: state.rootId, currentId: state.currentId, drillStack: state.drillStack }),
    }
  )
);


