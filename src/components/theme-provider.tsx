import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { setMode, toggleMode, type ThemeMode } from "@/redux/slices/themeSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";

interface ThemeProviderContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeProviderContext = createContext<ThemeProviderContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const applyThemeToDocument = (mode: ThemeMode) => {
  const root = document.documentElement;
  const isDark = mode === "dark";

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  const value = useMemo<ThemeProviderContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      setTheme: (nextMode: ThemeMode) => dispatch(setMode(nextMode)),
      toggleTheme: () => dispatch(toggleMode()),
    }),
    [dispatch, mode],
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
