import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the structure for column definitions
export interface ColumnDefinition {
  key: string;
  header: string;
}

// Define the state structure for this slice
interface DownloadableDataState {
  columns: ColumnDefinition[];
  data: any[]; // Using any[] for flexibility, consider defining specific row types if possible
  filename: string;
}

// Define the initial state
const initialState: DownloadableDataState = {
  columns: [],
  data: [],
  filename: 'data.csv', // Default filename
};

const downloadableDataSlice = createSlice({
  name: 'downloadableData',
  initialState,
  reducers: {
    /**
     * Updates the entire downloadable data state. Should be called by view components
     * whenever their display data (filtered, sorted) changes.
     */
    setDownloadableData(state, action: PayloadAction<DownloadableDataState>) {
      state.columns = action.payload.columns;
      state.data = action.payload.data;
      state.filename = action.payload.filename;
    },
    /**
     * Resets the downloadable data state to its initial empty state.
     * Could be called when data is cleared or on navigating away, if desired.
     */
    resetDownloadableData(state) {
        state.columns = initialState.columns;
        state.data = initialState.data;
        state.filename = initialState.filename;
    }
  },
});

// Export the actions
export const { setDownloadableData, resetDownloadableData } = downloadableDataSlice.actions;

// Export the reducer
export default downloadableDataSlice.reducer; 