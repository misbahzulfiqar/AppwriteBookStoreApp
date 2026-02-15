import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: false,
  userData: null,
  authChecked: false, // true after we've verified session on load/refresh
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload;
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
    },
    // Restore user from existing Appwrite session (e.g. after page refresh)
    setAuthFromSession: (state, action) => {
      state.userData = action.payload;
      state.status = !!action.payload;
      state.authChecked = true;
    },
  },
});

export const { login, logout, setAuthFromSession } = authSlice.actions;

export default authSlice.reducer;
