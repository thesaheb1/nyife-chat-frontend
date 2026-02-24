import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ConfirmationCallback = (() => void) | null;

export interface ConfirmationState {
  open: boolean;
  actionType: string | null;
  callbackFunction: ConfirmationCallback;
  customText: string | null;
}

export interface OpenConfirmationPayload {
  actionType: string;
  callbackFunction?: ConfirmationCallback;
  customText?: string | null;
}

const initialState: ConfirmationState = {
  open: false,
  actionType: null,
  callbackFunction: null,
  customText: null,
};

const confirmationSlice = createSlice({
  name: "confirmation",
  initialState,
  reducers: {
    openConfirmation: (state, action: PayloadAction<OpenConfirmationPayload>) => {
      state.open = true;
      state.actionType = action.payload.actionType;
      state.callbackFunction = action.payload.callbackFunction ?? null;
      state.customText = action.payload.customText ?? null;
    },
    closeConfirmation: (state) => {
      state.open = false;
      state.actionType = null;
      state.callbackFunction = null;
      state.customText = null;
    },
  },
});

export const { openConfirmation, closeConfirmation } = confirmationSlice.actions;

export default confirmationSlice.reducer;
