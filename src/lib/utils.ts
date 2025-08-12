import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


// Explicit list of supported Tailwind background color families for node fill selection
export const SUPPORTED_TAILWIND_BG_FAMILIES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type TailwindBgFamily = typeof SUPPORTED_TAILWIND_BG_FAMILIES[number];
export type TailwindBgShade = 300 | 500 | 700;

// Returns a concrete Tailwind class name. Using explicit literals ensures Tailwind can see and compile them.
export function getTailwindBgClass(family: TailwindBgFamily, shade: TailwindBgShade): string {
  if (family === "slate") {
    if (shade === 300) return "bg-slate-300";
    if (shade === 500) return "bg-slate-500";
    return "bg-slate-700";
  } else if (family === "gray") {
    if (shade === 300) return "bg-gray-300";
    if (shade === 500) return "bg-gray-500";
    return "bg-gray-700";
  } else if (family === "zinc") {
    if (shade === 300) return "bg-zinc-300";
    if (shade === 500) return "bg-zinc-500";
    return "bg-zinc-700";
  } else if (family === "neutral") {
    if (shade === 300) return "bg-neutral-300";
    if (shade === 500) return "bg-neutral-500";
    return "bg-neutral-700";
  } else if (family === "stone") {
    if (shade === 300) return "bg-stone-300";
    if (shade === 500) return "bg-stone-500";
    return "bg-stone-700";
  } else if (family === "red") {
    if (shade === 300) return "bg-red-300";
    if (shade === 500) return "bg-red-500";
    return "bg-red-700";
  } else if (family === "orange") {
    if (shade === 300) return "bg-orange-300";
    if (shade === 500) return "bg-orange-500";
    return "bg-orange-700";
  } else if (family === "amber") {
    if (shade === 300) return "bg-amber-300";
    if (shade === 500) return "bg-amber-500";
    return "bg-amber-700";
  } else if (family === "yellow") {
    if (shade === 300) return "bg-yellow-300";
    if (shade === 500) return "bg-yellow-500";
    return "bg-yellow-700";
  } else if (family === "lime") {
    if (shade === 300) return "bg-lime-300";
    if (shade === 500) return "bg-lime-500";
    return "bg-lime-700";
  } else if (family === "green") {
    if (shade === 300) return "bg-green-300";
    if (shade === 500) return "bg-green-500";
    return "bg-green-700";
  } else if (family === "emerald") {
    if (shade === 300) return "bg-emerald-300";
    if (shade === 500) return "bg-emerald-500";
    return "bg-emerald-700";
  } else if (family === "teal") {
    if (shade === 300) return "bg-teal-300";
    if (shade === 500) return "bg-teal-500";
    return "bg-teal-700";
  } else if (family === "cyan") {
    if (shade === 300) return "bg-cyan-300";
    if (shade === 500) return "bg-cyan-500";
    return "bg-cyan-700";
  } else if (family === "sky") {
    if (shade === 300) return "bg-sky-300";
    if (shade === 500) return "bg-sky-500";
    return "bg-sky-700";
  } else if (family === "blue") {
    if (shade === 300) return "bg-blue-300";
    if (shade === 500) return "bg-blue-500";
    return "bg-blue-700";
  } else if (family === "indigo") {
    if (shade === 300) return "bg-indigo-300";
    if (shade === 500) return "bg-indigo-500";
    return "bg-indigo-700";
  } else if (family === "violet") {
    if (shade === 300) return "bg-violet-300";
    if (shade === 500) return "bg-violet-500";
    return "bg-violet-700";
  } else if (family === "purple") {
    if (shade === 300) return "bg-purple-300";
    if (shade === 500) return "bg-purple-500";
    return "bg-purple-700";
  } else if (family === "fuchsia") {
    if (shade === 300) return "bg-fuchsia-300";
    if (shade === 500) return "bg-fuchsia-500";
    return "bg-fuchsia-700";
  } else if (family === "pink") {
    if (shade === 300) return "bg-pink-300";
    if (shade === 500) return "bg-pink-500";
    return "bg-pink-700";
  } else if (family === "rose") {
    if (shade === 300) return "bg-rose-300";
    if (shade === 500) return "bg-rose-500";
    return "bg-rose-700";
  }
  // Default fallback
  if (shade === 300) return "bg-blue-300";
  if (shade === 500) return "bg-blue-500";
  return "bg-blue-700";
}

// Returns a concrete Tailwind text color class name using explicit literals.
export function getTailwindTextClass(family: TailwindBgFamily, shade: TailwindBgShade): string {
  if (family === "slate") {
    if (shade === 300) return "text-slate-300";
    if (shade === 500) return "text-slate-500";
    return "text-slate-700";
  } else if (family === "gray") {
    if (shade === 300) return "text-gray-300";
    if (shade === 500) return "text-gray-500";
    return "text-gray-700";
  } else if (family === "zinc") {
    if (shade === 300) return "text-zinc-300";
    if (shade === 500) return "text-zinc-500";
    return "text-zinc-700";
  } else if (family === "neutral") {
    if (shade === 300) return "text-neutral-300";
    if (shade === 500) return "text-neutral-500";
    return "text-neutral-700";
  } else if (family === "stone") {
    if (shade === 300) return "text-stone-300";
    if (shade === 500) return "text-stone-500";
    return "text-stone-700";
  } else if (family === "red") {
    if (shade === 300) return "text-red-300";
    if (shade === 500) return "text-red-500";
    return "text-red-700";
  } else if (family === "orange") {
    if (shade === 300) return "text-orange-300";
    if (shade === 500) return "text-orange-500";
    return "text-orange-700";
  } else if (family === "amber") {
    if (shade === 300) return "text-amber-300";
    if (shade === 500) return "text-amber-500";
    return "text-amber-700";
  } else if (family === "yellow") {
    if (shade === 300) return "text-yellow-300";
    if (shade === 500) return "text-yellow-500";
    return "text-yellow-700";
  } else if (family === "lime") {
    if (shade === 300) return "text-lime-300";
    if (shade === 500) return "text-lime-500";
    return "text-lime-700";
  } else if (family === "green") {
    if (shade === 300) return "text-green-300";
    if (shade === 500) return "text-green-500";
    return "text-green-700";
  } else if (family === "emerald") {
    if (shade === 300) return "text-emerald-300";
    if (shade === 500) return "text-emerald-500";
    return "text-emerald-700";
  } else if (family === "teal") {
    if (shade === 300) return "text-teal-300";
    if (shade === 500) return "text-teal-500";
    return "text-teal-700";
  } else if (family === "cyan") {
    if (shade === 300) return "text-cyan-300";
    if (shade === 500) return "text-cyan-500";
    return "text-cyan-700";
  } else if (family === "sky") {
    if (shade === 300) return "text-sky-300";
    if (shade === 500) return "text-sky-500";
    return "text-sky-700";
  } else if (family === "blue") {
    if (shade === 300) return "text-blue-300";
    if (shade === 500) return "text-blue-500";
    return "text-blue-700";
  } else if (family === "indigo") {
    if (shade === 300) return "text-indigo-300";
    if (shade === 500) return "text-indigo-500";
    return "text-indigo-700";
  } else if (family === "violet") {
    if (shade === 300) return "text-violet-300";
    if (shade === 500) return "text-violet-500";
    return "text-violet-700";
  } else if (family === "purple") {
    if (shade === 300) return "text-purple-300";
    if (shade === 500) return "text-purple-500";
    return "text-purple-700";
  } else if (family === "fuchsia") {
    if (shade === 300) return "text-fuchsia-300";
    if (shade === 500) return "text-fuchsia-500";
    return "text-fuchsia-700";
  } else if (family === "pink") {
    if (shade === 300) return "text-pink-300";
    if (shade === 500) return "text-pink-500";
    return "text-pink-700";
  } else if (family === "rose") {
    if (shade === 300) return "text-rose-300";
    if (shade === 500) return "text-rose-500";
    return "text-rose-700";
  }
  if (shade === 300) return "text-blue-300";
  if (shade === 500) return "text-blue-500";
  return "text-blue-700";
}


