// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { useMemo, useEffect } from 'react'; // Added useEffect
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
// import { setResultVariation } from '../../../store/slices/cohortSlice'; // Removed unused setResultVariation
import { useCohortCalculatedData } from '../../../hooks/useCohortCalculatedData';
// import { StudentProcessedScores } from '../../../types'; // Removed unused StudentProcessedScores
import { useSortableTable } from '../../../hooks/useSortableTable';
import { setDownloadableData, ColumnDefinition } from '../../../store/slices/downloadableDataSlice'; // Import setDownloadableData & ColumnDefinition

// Updated row type
interface RangedAtarRow {
  studentName: string;
  teRange: string; // Use the raw TE range from the hook
  atarRange: string; // Use the pre-calculated displayAtarRange from the hook
}

// Define props for the component
interface RangedAtarsViewProps {
  mappingsLoaded: boolean;
}

// Define keys for sorting
type SortableKeys = keyof RangedAtarRow;

// Define Columns for CSV Export
const RANGED_ATARS_COLUMNS: ColumnDefinition[] = [
  { key: 'studentName', header: 'Student Name' },
  { key: 'teRange', header: 'TE Range' },
  { key: 'atarRange', header: 'ATAR Range' },
];

const RangedAtarsView = ({ mappingsLoaded }: RangedAtarsViewProps) => {
  const dispatch: AppDispatch = useDispatch();
  const resultVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation);
  // Select loading and error states from cohort slice
  const { data: cohortData, loading, error } = useSelector((state: RootState) => state.cohort);
  // const filters = useSelector((state: RootState) => state.cohort.filters); // Removed unused filters

  // Pass Redux state and mappingsLoaded to the hook
  const { processedStudentScores } = useCohortCalculatedData({
    data: cohortData,
    mappingsLoaded,
    variation: resultVariation.toString(),
  });

  // Get selectedStudentNames array from redux
  const selectedNames = useSelector((state: RootState) => state.cohort.filters.selectedStudentNames);

  // Map processedStudentScores to RangedAtarRow structure
  const rangedAtarRowsData: RangedAtarRow[] = useMemo(() => {
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
    let atarRows: RangedAtarRow[] = studentEntries.map(([studentName, scores]) => {
        // Construct teRange from raw lower/upper TE if needed for display
        let teRange = "N/A";
        if (scores.te !== "ATAR Ineligible" && scores.te !== "N/A" && scores.lowerTE !== "N/A" && scores.upperTE !== "N/A") {
             teRange = `${scores.lowerTE} - ${scores.upperTE}`;
         } else if (scores.te === "ATAR Ineligible") {
             teRange = "ATAR Ineligible";
         }

        return {
            studentName,
            teRange, 
            atarRange: scores.displayAtarRange
        };
    });

    return atarRows;
  }, [processedStudentScores, selectedNames]); // Add selectedNames dependency

  // Use the sorting hook
  const {
    sortedData: sortedUniqueStudentRangedAtars,
    handleSort,
    renderSortArrow
  } = useSortableTable<RangedAtarRow>({
      initialData: rangedAtarRowsData,
      initialSortCriteria: [
          { key: 'studentName', order: 'asc' }
      ]
  });

  // Effect to update downloadable data in Redux state
  useEffect(() => {
    // Data is already in the correct string format for ranges
    dispatch(setDownloadableData({
      columns: RANGED_ATARS_COLUMNS,
      data: sortedUniqueStudentRangedAtars,
      filename: `ranged-atars-data-var${resultVariation}.csv` // Dynamic filename
    }));
  }, [sortedUniqueStudentRangedAtars, resultVariation, dispatch]); // Dependencies: sortedData and resultVariation

  // --- Loading and Error States --- 
  if (loading) { // Use loading from Redux
    return <div className="text-center p-4">Loading Student Data...</div>;
  }
  if (!mappingsLoaded) {
      return <div className="text-center p-4">Loading Subject Mappings...</div>;
  }
  if (error) { // Use error from Redux
    return <div className="text-red-600 p-4">Error loading cohort data: {error}</div>;
  }
  // Adjust empty state message based on whether data exists and if a search is active
  if (!cohortData || !cohortData.students.length) {
    return (
      <div className="text-center p-4">
        No student data available. Please upload a file first.
      </div>
    );
  }
  if (sortedUniqueStudentRangedAtars.length === 0) {
    return (
      <div className="text-center p-4">
        {selectedNames.length > 0 
          ? `No ranged ATARs found for the selected student(s).`
          : 'No ranged ATARs to display for the current variation.'
        }
      </div>
    );
  }

  // --- Render Component --- 
  return (
    <div className="max-w-full mx-auto space-y-6 px-2 pb-2">
      <h2 className="text-2xl font-bold mb-4">Ranged ATARs</h2>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {RANGED_ATARS_COLUMNS.map((col) => (
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
            {sortedUniqueStudentRangedAtars.map((student) => (
              <tr key={student.studentName}> 
                {RANGED_ATARS_COLUMNS.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student[col.key as keyof RangedAtarRow]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedUniqueStudentRangedAtars.length} {selectedNames.length > 0 ? 'selected' : ''} students
      </div>
    </div>
  );
};

export default RangedAtarsView; 