// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setDownloadableData, ColumnDefinition } from '../../../store/slices/downloadableDataSlice';
import { useCohortCalculatedData } from '../../../hooks/useCohortCalculatedData';
// No longer need TE_to_ATAR_conversion here
import { useSortableTable } from '../../../hooks/useSortableTable';

// Row type now uses the displayAtar from the hook
interface AtarRow {
  studentName: string;
  te: string; // Keep raw TE for display/sorting if needed
  atar: string | number; // Use the displayAtar field from hook
}

// Define props for the component
interface AtarsViewProps {
  mappingsLoaded: boolean;
}

// Define keys for sorting
type SortableKeys = keyof AtarRow;

// Define Columns for CSV Export
const ATARS_TABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'studentName', header: 'Student Name' },
  { key: 'te', header: 'TE' },
  { key: 'atar', header: 'ATAR' },
];

const AtarsView = ({ mappingsLoaded }: AtarsViewProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { data, loading, error } = useSelector((state: RootState) => state.cohort);
  // Get selectedStudentNames array from redux
  const selectedNames = useSelector((state: RootState) => state.cohort.filters.selectedStudentNames);

  // Use the updated hook - destructure processedStudentScores
  const { processedStudentScores } = useCohortCalculatedData({
    data,
    mappingsLoaded,
    variation: "0", // Use "0" variation for non-ranged view
  });

  // Map processedStudentScores to AtarRow structure - calculation is already done!
  const atarRowsData = useMemo(() => {
    if (!processedStudentScores || Object.keys(processedStudentScores).length === 0) return [];

    // Get entries 
    let studentEntries = Object.entries(processedStudentScores);
    
    // Filter based on selectedNames array (if not empty)
    if (selectedNames.length > 0) {
        studentEntries = studentEntries.filter(([studentName]) =>
            selectedNames.includes(studentName)
        );
    }

    // Map the filtered entries
    let atarRows: AtarRow[] = studentEntries.map(([studentName, scores]) => {
      return {
        studentName,
        te: scores.te, // Keep raw TE if needed
        atar: scores.displayAtar // Use the pre-calculated display value
      };
    });

    return atarRows;
  }, [processedStudentScores, selectedNames]); // Add selectedNames dependency

  // Use the sorting hook
  const {
    sortedData: sortedUniqueStudentAtars,
    handleSort,
    renderSortArrow
  } = useSortableTable<AtarRow>({
      initialData: atarRowsData,
      initialSortCriteria: [
        { key: 'studentName', order: 'asc' }
      ]
  });

  // Effect to update downloadable data in Redux state
  useEffect(() => {
    // Format ATAR numbers to 2 decimal places for CSV
    const formattedData = sortedUniqueStudentAtars.map(row => ({
      ...row,
      atar: typeof row.atar === 'number' ? row.atar.toFixed(2) : row.atar,
    }));

    dispatch(setDownloadableData({
      columns: ATARS_TABLE_COLUMNS,
      data: formattedData,
      filename: 'atars-data.csv' // Specific filename for this view
    }));
  }, [sortedUniqueStudentAtars, dispatch]); // Dependency: update whenever sorted data changes

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
  if (!data || !data.students.length) {
    return (
      <div className="text-center p-4">
        No student data available. Please upload a file first.
      </div>
    );
  }
  if (sortedUniqueStudentAtars.length === 0) { 
    return (
      <div className="text-center p-4">
        {selectedNames.length > 0 
          ? `No ATARs found for the selected student(s).`
          : 'No ATARs to display.' 
        }
      </div>
    );
  }

  // --- Render Component (Keep table structure, update cell content) --- 
  return (
    <div className="max-w-full mx-auto">
       <h2 className="text-2xl font-bold mb-4">Student ATARs</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
                {ATARS_TABLE_COLUMNS.map((col) => (
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
            {sortedUniqueStudentAtars.map((student) => (
              <tr key={student.studentName}> 
                  {ATARS_TABLE_COLUMNS.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {/* Apply formatting consistent with useEffect */} 
                         {col.key === 'atar' && typeof student.atar === 'number' ? student.atar.toFixed(2) :
                         student[col.key as keyof AtarRow] }
                      </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer (Keep as is) */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedUniqueStudentAtars.length} {selectedNames.length > 0 ? 'selected' : ''} students
      </div>
    </div>
  );
};

export default AtarsView; 