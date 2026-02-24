import { useEffect, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { toggleMode } from "@/redux/slices/themeSlice";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();
  const darkMode = mode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <main
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center gap-4 p-4",
        darkMode
          ? "bg-[radial-gradient(circle_at_top,_#1b1e30_0%,_#0f111a_60%)]"
          : "bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eef2ff_58%,_#e2e8f0_100%)]",
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed top-5 right-5 z-50"
        onClick={() => dispatch(toggleMode())}
        aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      >
        {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      <section className="w-full max-w-md rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur">
        {children}
      </section>

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Copyright {new Date().getFullYear()} Complia Services Ltd. All rights reserved.
      </p>
    </main>
  );
}
