import {
  Selection,
  ScalingRow,
  YEARS,
  hasDataForSubjectAndYear
} from '../../utils/scalingDataUtils';

// Define Props for the component
interface SubjectSelectionTableProps {
  subjects: string[];
  allScalingData: ScalingRow[]; // Needed for hasData checks
  selections: Selection[];
  onClearAll: () => void;
  onToggleSelection: (subject: string, year: string) => void;
  onToggleYear: (year: string) => void;
  onToggleSubject: (subject: string) => void;
}

/**
 * Component responsible for rendering the subject/year selection sidebar.
 */
const SubjectSelectionTable = ({
  subjects,
  allScalingData,
  selections,
  onClearAll,
  onToggleSelection,
  onToggleYear,
  onToggleSubject
}: SubjectSelectionTableProps) => {

  // Helper functions moved inside the component, using props
  const isSelected = (subject: string, year: string) => {
    return selections.some(s => s.subject === subject && s.year === year);
  };

  const isYearSelected = (year: string) => {
    // Check against the subjects list passed as prop
    return subjects.every(subject => 
      !hasDataForSubjectAndYear(allScalingData, subject, year) || isSelected(subject, year)
    );
  };

  const isSubjectSelected = (subject: string) => {
    // Check against available years
    return YEARS.every(year => 
      !hasDataForSubjectAndYear(allScalingData, subject, year) || isSelected(subject, year)
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Subject Selection Column */}
      {/* Use max-width instead of fixed width, allow shrinking */}
      <div className="flex-none bg-white rounded-xl py-2 flex flex-col h-full overflow-hidden">
        <div className="px-2 flex-none">
          <button 
            className="mb-2 px-2 py-1 text-sm text-white bg-red-600 border border-red-700 rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={onClearAll} // Use passed handler
          >
            Clear All
          </button>
          
          <div className="mb-2 text-sm text-gray-500">Found {subjects.length} subjects</div>
        </div>
        
        {/* Scrollable table container */}
        <div className="overflow-y-auto flex-1 px-2">
          <table className="w-full border-collapse text-sm table-fixed">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="px-1 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200 w-auto"></th>
                {YEARS.map(year => (
                  <th key={year} className="px-0.5 py-1 text-center font-semibold text-gray-700 border-b border-gray-200 w-7">
                    <label className="flex flex-col items-center cursor-pointer gap-0.5">
                      <input
                        type="checkbox"
                        className="w-3 h-3"
                        checked={isYearSelected(year)}
                        onChange={() => onToggleYear(year)} // Use passed handler
                        // Optionally disable if no subjects have data for this year
                        disabled={!subjects.some(s => hasDataForSubjectAndYear(allScalingData, s, year))}
                      />
                      <span className="text-xs">{`'${year.slice(2)}`}</span>
                    </label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject}>
                  <td className="px-1 py-1.5 text-left font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white z-[1] w-auto">
                    <label className="flex items-start cursor-pointer gap-1">
                      <input
                        type="checkbox"
                        className="w-3 h-3 mt-0.5 flex-shrink-0"
                        checked={isSubjectSelected(subject)}
                        onChange={() => onToggleSubject(subject)} // Use passed handler
                      />
                      <span className="text-sm break-words hyphens-auto">{subject || '(Unnamed Subject)'}</span>
                    </label>
                  </td>
                  {YEARS.map(year => {
                    const hasData = hasDataForSubjectAndYear(allScalingData, subject, year);
                    return (
                      <td key={year} className="px-0.5 py-1.5 text-center border-b border-gray-200 w-7 hover:bg-gray-50 transition-colors">
                        {hasData ? (
                          <input
                            type="checkbox"
                            className="w-3 h-3 cursor-pointer"
                            checked={isSelected(subject, year)}
                            onChange={() => onToggleSelection(subject, year)} // Use passed handler
                          />
                        ) : (
                          // Render empty cell or placeholder if no data
                          <span className="text-gray-300">-</span> 
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectSelectionTable; 