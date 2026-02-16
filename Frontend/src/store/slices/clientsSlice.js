    import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  clients: [],
  selectedClient: null,
  clientsLoading: false,
  filters: {
    status: null,
    domain: null,
    course: null
  }
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients: (state, action) => {
      state.clients = action.payload;
    },
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    setClientsLoading: (state, action) => {
      state.clientsLoading = action.payload;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: null, domain: null, course: null };
    },
    updateClientInList: (state, action) => {
      const updatedClient = action.payload;
      const index = state.clients.findIndex(c => c._id === updatedClient._id);
      if (index !== -1) {
        state.clients[index] = updatedClient;
      }
    },
    removeClientFromList: (state, action) => {
      const clientId = action.payload;
      state.clients = state.clients.filter(c => c._id !== clientId);
      if (state.selectedClient?._id === clientId) {
        state.selectedClient = null;
      }
    },
    markStudentAsViewed: (state, action) => {
      const clientId = action.payload;
      const client = state.clients.find(c => c._id === clientId);
      if (client) {
        client.studentViewed = true;
        client.isNew = false;
      }
      if (state.selectedClient?._id === clientId) {
        state.selectedClient.studentViewed = true;
        state.selectedClient.isNew = false;
      }
    }
  }
});

export const {
  setClients,
  setSelectedClient,
  setClientsLoading,
  setFilter,
  clearFilters,
  updateClientInList,
  removeClientFromList,
  markStudentAsViewed
} = clientsSlice.actions;

export default clientsSlice.reducer;