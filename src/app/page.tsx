"use client";
import * as React from "react";
import { Topbar } from "@/components/topbar";
import { FlowEditor } from "@/components/diagram/FlowEditor";
import { ReactFlowProvider } from "reactflow";

export default function Home(): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <FlowEditor />
      </div>
    </ReactFlowProvider>
  );
}
