import { configureStore } from '@reduxjs/toolkit';
import counselorReducer from './slices/counselorSlice';
import dashboardReducer from './slices/dashboardSlice';
import clientsReducer from './slices/clientsSlice';

export const store = configureStore({
  reducer: {
    counselor: counselorReducer,
    dashboard: dashboardReducer,
    clients: clientsReducer,
  },
});