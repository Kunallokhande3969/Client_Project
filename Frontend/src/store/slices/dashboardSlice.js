import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'dashboard',
  domainStats: [],
  overallStats: {
    total: 0,
    new: 0,
    inProgress: 0,
    completed: 0,
  },
  courseStats: [],
  selectedDomain: null,
  selectedCourse: null,
  domainCourses: [],
  loading: false,
  exporting: false,
  deleteModal: null,
  isDeleting: false,
  isInitialized: false,
  lastUpdated: null,
  realTimeConnected: false,
  retryCount: 0
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    setDomainStats: (state, action) => {
      state.domainStats = action.payload;
    },
    setOverallStats: (state, action) => {
      state.overallStats = action.payload;
    },
    setCourseStats: (state, action) => {
      state.courseStats = action.payload;
    },
    setSelectedDomain: (state, action) => {
      state.selectedDomain = action.payload;
    },
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
    setDomainCourses: (state, action) => {
      state.domainCourses = action.payload;
    },
    setDashboardLoading: (state, action) => {
      state.loading = action.payload;
    },
    setExporting: (state, action) => {
      state.exporting = action.payload;
    },
    setDeleteModal: (state, action) => {
      state.deleteModal = action.payload;
    },
    setIsDeleting: (state, action) => {
      state.isDeleting = action.payload;
    },
    clearSelectedData: (state) => {
      state.selectedDomain = null;
      state.selectedCourse = null;
      state.courseStats = [];
      state.domainCourses = [];
    },
    setDashboardInitialized: (state) => {
      state.isInitialized = true;
      state.lastUpdated = Date.now();
      state.loading = false;
    },
    setRealTimeConnected: (state, action) => {
      state.realTimeConnected = action.payload;
    },
    updateDashboardStats: (state, action) => {
      const { domainStats, overallStats } = action.payload;
      if (domainStats) {
        state.domainStats = domainStats;
      }
      if (overallStats) {
        state.overallStats = overallStats;
      }
      state.lastUpdated = Date.now();
      if (!state.isInitialized) {
        state.isInitialized = true;
      }
    },
    setRetryCount: (state, action) => {
      state.retryCount = action.payload;
    }
  }
});

export const {
  setCurrentView,
  setDomainStats,
  setOverallStats,
  setCourseStats,
  setSelectedDomain,
  setSelectedCourse,
  setDomainCourses,
  setDashboardLoading,
  setExporting,
  setDeleteModal,
  setIsDeleting,
  clearSelectedData,
  setDashboardInitialized,
  setRealTimeConnected,
  updateDashboardStats,
  setRetryCount
} = dashboardSlice.actions;

export default dashboardSlice.reducer;