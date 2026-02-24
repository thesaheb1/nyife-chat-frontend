import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "user" | "subuser" | "admin" | "subadmin";

export interface UserData {
  email?: string;
  role?: UserRole;
  routeList?: unknown[];
  accessRoutes?: unknown[];
  [key: string]: unknown;
}

export interface UserState {
  login: boolean;
  type: UserRole | "";
  token: string | null;
  data: UserData;
}

interface AuthPayload extends UserData {
  token?: unknown;
}

const initialState: UserState = {
  login: false,
  type: "",
  token: null,
  data: {},
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    auth: (state, action: PayloadAction<AuthPayload | null | undefined>) => {
      if (!action.payload) {
        return;
      }

      const { token, ...user } = action.payload;
      const hasUserObject = Object.keys(user).length > 0;
      const isTokenValid = typeof token === "string" && token.trim() !== "";
      const isEmailValid = typeof user.email === "string" && user.email.trim() !== "";

      if (hasUserObject && isTokenValid && isEmailValid) {
        state.login = true;
        state.token = token;
        state.type =
          user.role === "user" ||
          user.role === "subuser" ||
          user.role === "admin" ||
          user.role === "subadmin"
            ? user.role
            : "";
        state.data = user;
      }
    },
    logout: (state) => {
      state.login = false;
      state.type = "";
      state.token = null;
      state.data = {};
    },
    updateUserData: (state, action: PayloadAction<UserData>) => {
      state.data = action.payload;
    },
  },
});

export const { auth, logout, updateUserData } = userSlice.actions;

export default userSlice.reducer;
