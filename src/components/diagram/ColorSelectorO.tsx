"use client";

import * as React from "react";
import {
    SUPPORTED_TAILWIND_BG_FAMILIES,
    type TailwindBgFamily,
    type TailwindBgShade,
    getTailwindBgClass,
    getTailwindTextClass,
} from "@/lib/utils";

type Mode = "bg" | "text";

type Props = {
    label: string;
    value: string; // either a Tailwind class like bg-blue-500/text-blue-500 or a hex fallback
    mode?: Mode;
    onChange: (nextClassOrHex: string) => void;
};

export function ColorSelector({ label, value, mode = "bg", onChange }: Props): React.JSX.Element {
    const [family, setFamily] = React.useState<TailwindBgFamily>("blue");
    const [shade, setShade] = React.useState<TailwindBgShade>(500);

    React.useEffect(() => {
        const pattern = mode === "bg" ? /^bg-([a-z]+)-(300|500|700)$/ : /^text-([a-z]+)-(300|500|700)$/;
        const parsed = String(value ?? "").match(pattern);
        if (parsed) {
            setFamily(parsed[1] as TailwindBgFamily);
            setShade(Number(parsed[2]) as TailwindBgShade);
        }
    }, [mode, value]);

    const renderSwatch = (s: TailwindBgShade) => {
        const cls = mode === "bg" ? getTailwindBgClass(family, s) : getTailwindTextClass(family, s);
        const isActive = shade === s;
        return (
            <button
                key={s}
                type="button"
                className={`h-6 w-6 rounded border ${mode === "bg" ? cls : "bg-white " + cls} ${isActive ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                aria-label={`Set shade ${s}`}
                onClick={() => {
                    setShade(s);
                    const next = mode === "bg" ? getTailwindBgClass(family, s) : getTailwindTextClass(family, s);
                    onChange(next);
                }}
                title={`${family} ${s}`}
            />
        );
    };

    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">{label}</label>
            <div className="space-y-2">
                <select
                    className="w-full rounded border px-2 py-1 bg-transparent"
                    value={family}
                    onChange={(e) => {
                        const nextFamily = e.target.value as TailwindBgFamily;
                        setFamily(nextFamily);
                        const next = mode === "bg" ? getTailwindBgClass(nextFamily, shade) : getTailwindTextClass(nextFamily, shade);
                        onChange(next);
                    }}
                >
                    {SUPPORTED_TAILWIND_BG_FAMILIES.map((fam) => (
                        <option key={fam} value={fam}>
                            {fam}
                        </option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    {[300, 500, 700].map((s) => renderSwatch(s as TailwindBgShade))}
                </div>
            </div>
        </div>
    );
}


