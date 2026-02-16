import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: localStorage.getItem('counselorProfile') 
    ? JSON.parse(localStorage.getItem('counselorProfile')) 
    : null,
  token: localStorage.getItem('counselorToken') || null,
  loading: false,
  error: null
};

const counselorSlice = createSlice({
  name: 'counselor',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      localStorage.setItem('counselorProfile', JSON.stringify(action.payload));
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('counselorToken', action.payload);
      } else {
        localStorage.removeItem('counselorToken');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.profile = null;
      state.token = null;
      localStorage.removeItem('counselorToken');
      localStorage.removeItem('counselorProfile');
    }
  }
});

export const { setProfile, setToken, setLoading, setError, logout } = counselorSlice.actions;
export default counselorSlice.reducer;