import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserData {
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface UserState {
  login: boolean;
  type: string;
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
        state.type = typeof user.role === "string" ? user.role : "";
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
