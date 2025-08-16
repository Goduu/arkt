"use client"

import { useAppStore } from "@/lib/store"
import { getIconByKey } from "@/lib/iconRegistry"
import { cn } from "@/lib/utils"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    Home,
    Layers,
    Settings,
    HelpCircle,
    FileText,
    Search,
    Link as LinkIcon,
    PlusCircle,
    Text,
    Type,
    LineChart,
    LineSquiggle,
} from "lucide-react"

export function AppSidebar() {
    const { nodeTemplates, setPendingSpawn, setPendingCommand } = useAppStore()
    return (
        <Sidebar collapsible="icon" side="left">
            <SidebarHeader>
                <div className="flex gap-4 px-2 items-center w-full justify-start group-data-[collapsible=icon]:justify-center">
                    <div className="size-6 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center font-semibold shrink-0">A</div>
                    <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">ArchKT</span>
                </div>
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <div className="relative">
                        <SidebarInput placeholder="Search..." />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Home">
                                    <Home />
                                    <span>Home</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Diagrams">
                                    <Layers />
                                    <span>Diagrams</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Templates" onClick={() => setPendingCommand({ type: "openTemplates" })}>
                                    <FileText />
                                    <span>Templates</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupLabel>Add</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Add Text" onClick={() => setPendingCommand({ type: "addText" })}>
                                    <Type />
                                    <span>Add text</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Add Node" onClick={() => setPendingCommand({ type: "addNode" })}>
                                    <Layers />
                                    <span>Add node</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Add Line" onClick={() => setPendingCommand({ type: "addLine" })}>
                                    <LineSquiggle />
                                    <span>Add line</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Add Virtual Node" onClick={() => setPendingCommand({ type: "addVirtual" })}>
                                    <LinkIcon />
                                    <span>Add virtual node</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarSeparator />

                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Create Template" onClick={() => setPendingCommand({ type: "openCreateTemplate" })}>
                                    <PlusCircle />
                                    <span>Create template</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {Object.values(nodeTemplates).map((tpl) => {
                                const def = getIconByKey(tpl.data.iconKey)
                                const I = def?.Icon
                                return (
                                    <SidebarMenuItem key={tpl.id}>
                                        <SidebarMenuButton
                                            tooltip={tpl.name}
                                            onClick={() => setPendingSpawn({ templateId: tpl.id })}
                                            className="inline-flex items-center gap-2"
                                        >
                                            <span
                                                className={cn(
                                                    "inline-flex items-center justify-center",
                                                    tpl.type === "ellipse" ? "rounded-full" : "rounded-sm",
                                                    "border size-3.5",
                                                    I && "group-data-[collapsible=icon]:hidden",
                                                    typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-") ? tpl.data.fillColor : "",
                                                    typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-") ? tpl.data.borderColor : "",
                                                )}
                                                style={{
                                                    backgroundColor:
                                                        typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-")
                                                            ? undefined
                                                            : (tpl.data.fillColor as string | undefined),
                                                    borderColor:
                                                        typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-")
                                                            ? undefined
                                                            : (tpl.data.borderColor as string | undefined),
                                                }}
                                            />
                                            {I ? <I className={cn(
                                                "h-4 w-4 hidden group-data-[collapsible=icon]:block border rounded-sm",
                                                typeof tpl.data.fillColor === "string" && tpl.data.fillColor.startsWith("bg-") ? tpl.data.fillColor : "",
                                                typeof tpl.data.borderColor === "string" && tpl.data.borderColor.startsWith("border-") ? tpl.data.borderColor : "",
                                            )} /> : null}
                                            {I ? <I className={cn(
                                                "h-4 w-4 block group-data-[collapsible=icon]:hidden",
                                            )} /> : null}
                                            <span className="group-data-[collapsible=icon]:hidden">{tpl.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarTrigger className="opacity-50 hover:opacity-100" />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}