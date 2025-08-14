"use client";

import * as React from "react";
import { ICONS, getIconByKey } from "@/lib/iconRegistry";

type Props = {
  label?: string;
  value?: string;
  onChange: (key: string | undefined) => void;
};

export function IconSelector({ label = "Icon", value, onChange }: Props): React.JSX.Element {
  const selected = getIconByKey(value);
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`h-8 px-2 rounded border text-xs ${!selected ? "bg-accent/40" : "hover:bg-muted"}`}
          onClick={() => onChange(undefined)}
          title="No icon"
        >
          None
        </button>
        {ICONS.map((def) => {
          const I = def.Icon;
          const isActive = def.key === selected?.key;
          return (
            <button
              key={def.key}
              type="button"
              className={`h-8 px-2 rounded border text-xs inline-flex items-center gap-1 ${isActive ? "ring-2 ring-offset-1 ring-primary bg-accent/40" : "hover:bg-muted"}`}
              onClick={() => onChange(def.key)}
              title={def.label}
              aria-label={def.label}
            >
              <I className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}


