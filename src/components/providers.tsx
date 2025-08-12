"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient());
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}


