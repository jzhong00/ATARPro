// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setResultVariation } from '../../../store/slices/cohortSlice';
import { setDownloadableData, ColumnDefinition } from '../../../store/slices/downloadableDataSlice';
import { useCohortCalculatedData, CalculatedTableRow } from '../../../hooks/useCohortCalculatedData';
import { useSortableTable } from '../../../hooks/useSortableTable';

// CombinedRangedRow now directly uses fields from CalculatedTableRow from the hook
// which already includes displayAtar and displayAtarRange (renamed here to atarRange for consistency)
interface CombinedRangedRow extends CalculatedTableRow {
    // displayAtarRange is renamed to atarRange for sorting key consistency
    atarRange: string;
    // We might not explicitly need displayAtar here if not displayed/sorted separately
}

// Define props for the component
interface RangedResultsViewProps {
  mappingsLoaded: boolean;
}

// Define keys for sorting (use atarRange directly)
type SortableKeys = keyof CombinedRangedRow;

// Define Columns for CSV Export
const RANGED_RESULTS_COLUMNS: ColumnDefinition[] = [
  { key: 'studentName', header: 'Student Name' },
  { key: 'subjectDisplay', header: 'Subject' },
  { key: 'resultRange', header: 'Result Range' },
  { key: 'scaledRange', header: 'Scaled Range' },
  { key: 'atarRange', header: 'ATAR Range' }, // Use the mapped key
];

const RangedResultsView = ({ mappingsLoaded }: RangedResultsViewProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { data, loading, error, filters } = useSelector((state: RootState) => state.cohort);
  // Get selectedStudentNames array from redux
  const selectedNames = useSelector((state: RootState) => state.cohort.filters.selectedStudentNames);
  // Get resultVariation directly from redux filters
  const resultVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation);

  // Use the updated custom hook - Pass resultVariation directly from Redux
  const { tableData } = useCohortCalculatedData({
    data,
    mappingsLoaded,
    variation: resultVariation.toString(), // Use redux value directly
  });

  // Prepare data for the sortable table hook
  // Rename displayAtarRange to atarRange for the table
  const combinedData = useMemo(() => {
    if (!tableData) return [];

    // Filter data based on selectedNames array (if not empty)
    const filteredData = selectedNames.length > 0
      ? tableData.filter(row => 
          selectedNames.includes(row.studentName)
        )
      : tableData; // No filter applied if selectedNames is empty

    // Then map the filtered data
    return filteredData.map(row => ({
        ...row,
        atarRange: row.displayAtarRange // Map displayAtarRange to atarRange
    }));
  }, [tableData, selectedNames]); // Add selectedNames dependency

  // Use the sorting hook
  const {
    sortedData,
    handleSort,
    renderSortArrow
  } = useSortableTable<CombinedRangedRow>({
      initialData: combinedData,
      // Set initial multi-level sort: Student Name (asc), then Scaled Range (desc)
      initialSortCriteria: [
          { key: 'studentName', order: 'asc' },
          { key: 'scaledRange', order: 'desc' } 
      ]
  });

  // Effect to update downloadable data in Redux state
  useEffect(() => {
    // Data is already in the correct string format for ranges
    dispatch(setDownloadableData({
      columns: RANGED_RESULTS_COLUMNS,
      data: sortedData,
      filename: `ranged-results-data-var${resultVariation}.csv` // Dynamic filename
    }));
  }, [sortedData, resultVariation, dispatch]); // Dependencies: sortedData and resultVariation

  // --- Loading and Error States --- 
  if (loading) {
    return <div className="text-center p-4">Loading Student Data...</div>;
  }
  if (!mappingsLoaded) {
      return <div className="text-center p-4">Loading Subject Mappings...</div>;
  }
  if (error) {
    return <div className="text-red-600 p-4">Error loading cohort data: {error}</div>;
  }
  if (!data || !data.students.length) {
    return (
      <div className="text-center p-4">
        No student data available. Please upload a file first.
      </div>
    );
  }
  if (sortedData.length === 0) {
    return (
      <div className="text-center p-4">
        {selectedNames.length > 0 
          ? `No results found for the selected student(s).`
          : 'No results to display for the current variation.' 
        }
      </div>
    );
  }

  // --- Render Component --- 
  return (
    <div className="max-w-full mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ranged Results</h2>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
                {RANGED_RESULTS_COLUMNS.map((col) => (
                    <th 
                        key={col.key} 
                        className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer" 
                        onClick={() => handleSort(col.key as SortableKeys)}
                    >
                        {col.header}{renderSortArrow(col.key as SortableKeys)}
                    </th>
                ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row) => {
              return (
                <tr key={row.id}> 
                  {RANGED_RESULTS_COLUMNS.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[col.key as keyof CombinedRangedRow]}
                      </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedData.length} {selectedNames.length > 0 ? 'selected' : ''} entries
      </div>
    </div>
  );
};

export default RangedResultsView; 