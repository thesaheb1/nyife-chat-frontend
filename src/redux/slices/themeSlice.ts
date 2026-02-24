import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

export interface ThemeState {
  mode: ThemeMode;
}

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const persistedRoot = localStorage.getItem("persist:root");

    if (persistedRoot) {
      const parsedRoot = JSON.parse(persistedRoot) as { theme?: string };

      if (parsedRoot.theme) {
        const parsedTheme = JSON.parse(parsedRoot.theme) as { mode?: ThemeMode };
        if (parsedTheme.mode === "light" || parsedTheme.mode === "dark") {
          return parsedTheme.mode;
        }
      }
    }
  } catch {
    // Ignore malformed persisted values and fall back to system preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const initialState: ThemeState = {
  mode: getInitialThemeMode(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleMode(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
  },
});

export const { setMode, toggleMode } = themeSlice.actions;
export default themeSlice.reducer;
