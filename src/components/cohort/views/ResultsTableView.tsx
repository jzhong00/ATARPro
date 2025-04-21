// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setDownloadableData, ColumnDefinition } from '../../../store/slices/downloadableDataSlice';
import { useCohortCalculatedData, CalculatedTableRow } from '../../../hooks/useCohortCalculatedData';
import { useSortableTable } from '../../../hooks/useSortableTable';

// Define props for the component
interface ResultsTableViewProps {
  mappingsLoaded: boolean;
}

// Row type for the table can now potentially just be CalculatedTableRow
// If we need to rename fields for display/sorting, we can extend or map
// For simplicity, let's assume CalculatedTableRow is sufficient for now
// We might need to adjust sort keys if they rely on specific names like 'atar' or 'te'
interface ResultsTableRow extends CalculatedTableRow {
    // Add fields specifically for sorting if names differ, e.g.:
    // teValueForSort: string; 
    // atarValueForSort: string | number;
    // For now, we assume the hook's fields suffice or sorting adapts
}

// Define keys for sorting - should match the fields in the data passed to useSortableTable
// Adjust these if CalculatedTableRow fields aren't directly sortable or need renaming
type SortableKeys = keyof ResultsTableRow;

// Define Columns for CSV Export
const RESULTS_TABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'studentName', header: 'Student Name' },
  { key: 'subjectDisplay', header: 'Subject' },
  { key: 'result', header: 'Result' },
  { key: 'scaled', header: 'Scaled' },
  { key: 'te', header: 'TE' },
  { key: 'displayAtar', header: 'ATAR' },
];

const ResultsTableView = ({ mappingsLoaded }: ResultsTableViewProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { data, loading, error } = useSelector((state: RootState) => state.cohort);
  // Get selectedStudentNames array from redux
  const selectedNames = useSelector((state: RootState) => state.cohort.filters.selectedStudentNames);

  // Get tableData directly - it now contains displayAtar and displayAtarRange
  const { tableData } = useCohortCalculatedData({
    data,
    mappingsLoaded,
    variation: "0", // Use variation 0 for non-ranged results view
  });

  // Prepare data for the sortable table hook
  // If CalculatedTableRow structure is okay for the table, pass it directly
  // If renaming/mapping is needed (e.g., displayAtar -> atar), do it here.
  const tableRowsForSort: ResultsTableRow[] = useMemo(() => {
      if (!tableData) return [];

      // Filter data based on selectedNames array (if not empty)
      const filteredData = selectedNames.length > 0
        ? tableData.filter(row =>
            selectedNames.includes(row.studentName)
          )
        : tableData; // No filter applied if selectedNames is empty

      // Map the filtered data (example mapping kept for context)
      return filteredData.map(row => ({
          ...row,
          // Rename fields if the sort keys expect 'te' or 'atar'
          // te: row.?, 
          // atar: row.displayAtar 
      }));
  }, [tableData, selectedNames]); // Add selectedNames dependency

  // Use the sorting hook with the prepared data
  const {
    sortedData,
    handleSort,
    renderSortArrow
  } = useSortableTable<ResultsTableRow>({
      initialData: tableRowsForSort, // Use the mapped data
      // Set initial multi-level sort: Student Name (asc), then Scaled (desc)
      initialSortCriteria: [
        { key: 'studentName', order: 'asc' },
        { key: 'scaled', order: 'desc' }
      ]
  });

  // Effect to update downloadable data in Redux state
  useEffect(() => {
    // Format scaled and ATAR numbers to 1 and 2 decimal places respectively for CSV
    const formattedData = sortedData.map(row => ({
        ...row,
        scaled: typeof row.scaled === 'number' ? row.scaled.toFixed(1) : row.scaled,
        displayAtar: typeof row.displayAtar === 'number' ? row.displayAtar.toFixed(2) : row.displayAtar,
    }));

    dispatch(setDownloadableData({
        columns: RESULTS_TABLE_COLUMNS,
        data: formattedData,
        filename: 'results-data.csv' // Specific filename for this view
    }));
  }, [sortedData, dispatch]); // Dependency: update whenever sortedData changes

  // --- Loading and Error States (Keep as is) --- 
  if (loading) {
    return <div className="text-center p-4">Loading Student Data...</div>;
  }
  if (!mappingsLoaded) { 
      return <div className="text-center p-4">Loading Subject Mappings...</div>;
  }
  if (error) {
    return <div className="text-red-600 p-4">Error loading cohort data: {error}</div>;
  }
  // Adjust empty state message based on whether data exists and if a filter is active
  if (!data || !data.students.length) { // No data uploaded yet
    return (
      <div className="text-center p-4">
        No student data available. Please upload a file first.
      </div>
    );
  } 
  if (sortedData.length === 0) { // Data exists, but current filter/view yields no results
    return (
      <div className="text-center p-4">
        {selectedNames.length > 0 
          ? `No results found for the selected student(s).`
          : 'No results to display for the current view.' 
        }
      </div>
    );
  }

  // --- Render Component (Update table headers/cells if needed) --- 
  return (
    <div className="max-w-full mx-auto">
       <h2 className="text-2xl font-bold mb-4">Student Results</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {/* Map headers dynamically from columns definition if desired, or keep static */}
              {RESULTS_TABLE_COLUMNS.map((col) => (
                  <th 
                    key={col.key} 
                    className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer" 
                    onClick={() => handleSort(col.key as SortableKeys)} // Cast key to SortableKeys
                   >
                    {col.header}{renderSortArrow(col.key as SortableKeys)}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row) => {
              // Ensure row.id exists and is unique if ResultsTableRow is just CalculatedTableRow
              const key = `${row.studentName}-${row.subjectOriginal}-${row.id}`; // More robust key
              return (
                <tr key={key}>
                    {/* Render cells based on columns definition */}
                    {RESULTS_TABLE_COLUMNS.map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* Apply formatting consistent with useEffect */} 
                            {col.key === 'scaled' && typeof row.scaled === 'number' ? row.scaled.toFixed(1) :
                            col.key === 'te' ? row.te :
                             col.key === 'displayAtar' && typeof row.displayAtar === 'number' ? row.displayAtar.toFixed(2) :
                             row[col.key as keyof ResultsTableRow] // Access data using the key
                            }
                        </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedData.length} {selectedNames.length > 0 ? 'selected' : ''} entries
      </div>
    </div>
  );
};

export default ResultsTableView;