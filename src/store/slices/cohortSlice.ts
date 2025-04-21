// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CohortState, CohortData } from '../../types/cohort';

const initialState: CohortState = {
  data: null,
  loading: false,
  error: null,
  view: 'upload',
  filters: {
    selectedStudentNames: [],
    resultVariation: 3,
  },
};

const cohortSlice = createSlice({
  name: 'cohort',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCohortData: (state, action: PayloadAction<CohortData>) => {
      state.data = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearData: (state) => {
      state.data = null;
      state.error = null;
      state.view = 'upload';
      state.filters = { ...initialState.filters, selectedStudentNames: [] };
    },
    setView: (state, action: PayloadAction<CohortState['view']>) => {
      state.view = action.payload;
    },
    addSelectedStudent: (state, action: PayloadAction<string>) => {
      const nameToAdd = action.payload;
      if (!state.filters.selectedStudentNames.includes(nameToAdd)) {
        state.filters.selectedStudentNames.push(nameToAdd);
        state.filters.selectedStudentNames.sort((a, b) => a.localeCompare(b));
      }
    },
    removeSelectedStudent: (state, action: PayloadAction<string>) => {
      state.filters.selectedStudentNames = state.filters.selectedStudentNames.filter(
        name => name !== action.payload
      );
    },
    clearSelectedStudents: (state) => {
      state.filters.selectedStudentNames = [];
    },
    setResultVariation: (state, action: PayloadAction<number>) => {
      state.filters.resultVariation = action.payload;
    },
  },
});

export const {
  setLoading,
  setCohortData,
  setError,
  clearData,
  setView,
  addSelectedStudent,
  removeSelectedStudent,
  clearSelectedStudents,
  setResultVariation,
} = cohortSlice.actions;

export default cohortSlice.reducer; 