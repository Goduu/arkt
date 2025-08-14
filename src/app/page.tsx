import * as React from "react";
import { Topbar } from "@/components/topbar";
import { FlowEditor } from "@/components/diagram/FlowEditor";

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <FlowEditor />
    </div>
  );
}
