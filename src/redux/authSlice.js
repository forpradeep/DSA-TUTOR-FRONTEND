import { createSlice } from '@reduxjs/toolkit';

const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: userFromStorage,
    token: localStorage.getItem('token') || null
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;