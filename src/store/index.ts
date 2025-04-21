// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { configureStore } from '@reduxjs/toolkit';
import cohortReducer from './slices/cohortSlice';
import downloadableDataReducer from './slices/downloadableDataSlice';

export const store = configureStore({
  reducer: {
    cohort: cohortReducer,
    downloadableData: downloadableDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 