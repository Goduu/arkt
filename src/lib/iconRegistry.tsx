"use client";
import {
  Activity,
  Database,
  Cloud,
  Server,
  Shield,
  Globe,
  Box,
  Cpu,
  Code2,
  GitBranch,
  CircuitBoard,
  Rocket,
  Layers,
  LucideIcon,
} from "lucide-react";

export type IconKey =
  | "none"
  | "activity"
  | "database"
  | "cloud"
  | "server"
  | "shield"
  | "globe"
  | "box"
  | "cpu"
  | "code"
  | "git-branch"
  | "circuit"
  | "rocket"
  | "layers";

export type IconDefinition = {
  key: IconKey;
  label: string;
  Icon: LucideIcon;
};

export const ICONS: IconDefinition[] = [
  { key: "activity", label: "Activity", Icon: Activity },
  { key: "database", label: "Database", Icon: Database },
  { key: "cloud", label: "Cloud", Icon: Cloud },
  { key: "server", label: "Server", Icon: Server },
  { key: "shield", label: "Shield", Icon: Shield },
  { key: "globe", label: "Globe", Icon: Globe },
  { key: "box", label: "Box", Icon: Box },
  { key: "cpu", label: "CPU", Icon: Cpu },
  { key: "code", label: "Code", Icon: Code2 },
  { key: "git-branch", label: "Git Branch", Icon: GitBranch },
  { key: "circuit", label: "Circuit", Icon: CircuitBoard },
  { key: "rocket", label: "Rocket", Icon: Rocket },
  { key: "layers", label: "Layers", Icon: Layers },
];

export function getIconByKey(key: string | undefined): IconDefinition | undefined {
  if (!key || key === "none") return undefined;
  return ICONS.find((d) => d.key === key);
}


