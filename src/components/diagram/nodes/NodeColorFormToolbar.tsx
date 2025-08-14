"use client";

import * as React from "react";
import { useReactFlow } from "reactflow";
import { cn, getTailwindBgClass, TAILWIND_MAIN_COLORS, type TailwindBgShade, type TailwindBgFamily } from "@/lib/utils";

type Props = {
    colors: TailwindBgFamily[];
    fillColor?: string;
    onClick?: (family: TailwindBgFamily) => void;
};

export function NodeColorFormToolbar({ fillColor, colors, onClick }: Props): React.JSX.Element {
    const rf = useReactFlow();

    const { currentFamily, currentShade } = React.useMemo(() => {
        const match = String(fillColor ?? "").match(/^bg-([a-z]+)-(300|500|700)$/);
        const family = (match?.[1] as TailwindBgFamily | undefined) ?? undefined;
        const shade = (match?.[2] ? Number(match[2]) : 500) as TailwindBgShade;
        return { currentFamily: family, currentShade: shade };
    }, [fillColor]);



    return (
        <div className="flex gap-0.5 rounded-lg p-1">
            {colors.map((colorOption) => {
                const isActive = currentFamily === colorOption;
                return (
                    <button
                        key={colorOption}
                        type="button"
                        onClick={() => onClick?.(colorOption)}
                        className={cn(
                            getTailwindBgClass(colorOption, currentShade),
                            "size-6 rounded-full cursor-pointer transition-all duration-200 border",
                            isActive ? "ring-2 ring-offset-1 ring-primary" : ""
                        )}
                        aria-label={`Set color to ${colorOption}`}
                        title={`Set color to ${colorOption}`}
                    />
                );
            })}
        </div>
    );
}