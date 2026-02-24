import type { ReactNode } from "react";

import ThemeToggle from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark } = useTheme();

  return (
    <main
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center gap-4 p-4",
        isDark
          ? "bg-[radial-gradient(circle_at_top,_#21120a_0%,_#14100f_45%,_#0b0b0c_100%)]"
          : "bg-[radial-gradient(circle_at_top,_#fff8f4_0%,_#fff2ea_38%,_#f5f8fb_100%)]",
      )}
    >
      <ThemeToggle className="fixed top-5 right-5 z-50" />

      <section className="w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-6 shadow-[0_10px_40px_-16px_rgba(255,81,0,0.35)] backdrop-blur">
        {children}
      </section>

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Copyright {new Date().getFullYear()} Complia Services Ltd. All rights reserved.
      </p>
    </main>
  );
}
