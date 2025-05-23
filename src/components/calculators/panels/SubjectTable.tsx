import React from 'react';
import type { SubjectRow } from '../../../types/calculator';
import type { ScalingResult } from '../../../utils/scaling';
import SubjectInput from '../../common/SubjectInput';
import ResultInput from '../../common/ResultInput';
import type { SubjectMapping } from '../../../services/subjectMappingService';

interface ScaledScoresMap {
  get: (id: string) => {
    lower: ScalingResult | null;
    result: ScalingResult | null;
    upper: ScalingResult | null;
  } | undefined;
}

interface SubjectTableProps {
  subjectRows: SubjectRow[];
  rangeMode: boolean;
  scaledScoresMap: ScaledScoresMap;
  allSubjects: SubjectMapping[];
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onSubjectChange: (id: string, value: string | null) => void;
  onResultChange: (id: string, value: string | null) => void;
  onLowerResultChange: (id: string, value: string | null) => void;
  onUpperResultChange: (id: string, value: string | null) => void;
}

const SubjectTable: React.FC<SubjectTableProps> = ({
  subjectRows,
  rangeMode,
  scaledScoresMap,
  allSubjects,
  onAddRow,
  onDeleteRow,
  onSubjectChange,
  onResultChange,
  onLowerResultChange,
  onUpperResultChange
}) => {
  // Create an adapter for the SubjectInput onChange
  const handleSubjectInputChange = (rowId: string, value: string) => {
    // Convert empty string to null for the parent component's handler
    onSubjectChange(rowId, value === '' ? null : value);
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {rangeMode ? (
                <>
                  <th scope="col" className="px-1.5 xl:px-3 py-1.5 xl:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">Subject</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Lower result</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Result</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Upper result</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Scaled Range</th>
                </>
              ) : (
                <>
                  <th scope="col" className="px-1.5 xl:px-3 py-1.5 xl:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-6/12">Subject</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Result</th>
                  <th scope="col" className="px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Scaled</th>
                </>
              )}
              <th scope="col" className="px-1 py-1.5 xl:py-2 w-1/12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjectRows.map((row) => (
              <tr key={row.id}>
                <td className={`px-1.5 xl:px-3 py-1 xl:py-1.5 whitespace-nowrap border border-gray-200 ${!rangeMode ? "w-6/12" : "w-5/12"}`}>
                  <SubjectInput
                    value={row.subject}
                    subjects={allSubjects}
                    onChange={(val) => handleSubjectInputChange(row.id, val)}
                  />
                </td>
                {/* === Conditional Result Inputs === */}
                {rangeMode ? (
                  <>
                    <td className="px-1.5 xl:px-2 py-1 xl:py-1.5 whitespace-nowrap border border-gray-200 w-1/12">
                      <ResultInput
                        value={row.lowerResult}
                        onBlur={(val) => onLowerResultChange(row.id, val)} // Use onBlur
                        validationRule={row.validationRule}
                        rangeMode={true}
                      />
                    </td>
                    <td className="px-1.5 xl:px-2 py-1 xl:py-1.5 whitespace-nowrap border border-gray-200 w-1/12">
                      <ResultInput
                        value={row.rawResult}
                        onBlur={(val) => onResultChange(row.id, val)} // Use onBlur
                        validationRule={row.validationRule}
                        rangeMode={true}
                      />
                    </td>
                    <td className="px-1.5 xl:px-2 py-1 xl:py-1.5 whitespace-nowrap border border-gray-200 w-1/12">
                      <ResultInput
                        value={row.upperResult}
                        onBlur={(val) => onUpperResultChange(row.id, val)} // Use onBlur
                        validationRule={row.validationRule}
                        rangeMode={true}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-1.5 xl:px-2 py-1 xl:py-1.5 whitespace-nowrap border border-gray-200 w-3/12">
                      <ResultInput
                        value={row.rawResult}
                        onBlur={(val) => onResultChange(row.id, val)} // Use onBlur
                        validationRule={row.validationRule}
                        rangeMode={false}
                      />
                    </td>
                  </>
                )}

                <td className={`px-1.5 xl:px-2 py-1 xl:py-1.5 whitespace-nowrap text-sm xl:text-base text-gray-500 text-center border border-gray-200 ${rangeMode ? "w-2/12" : "w-2/12"}`}>
                  {(() => {
                    const scaledRange = scaledScoresMap.get(row.id);
                    if (!scaledRange) return '-';

                    // Helper to format a single score or error
                    const formatScore = (scoreResult: ScalingResult | null): React.ReactNode => {
                      if (scoreResult === null) return '-';
                      if (scoreResult.error) return <span title={scoreResult.error} className="text-red-500">Err</span>;
                      return scoreResult.scaledScore.toFixed(1);
                    };

                    if (rangeMode) {
                      const lowerStr = formatScore(scaledRange.lower);
                      const resultStr = formatScore(scaledRange.result);
                      const upperStr = formatScore(scaledRange.upper);
                      return <>{lowerStr} - {resultStr} - {upperStr}</>;
                    } else {
                      return formatScore(scaledRange.result);
                    }
                  })()}
                </td>
                <td className="px-1 py-1 xl:py-1.5 whitespace-nowrap text-center text-sm font-medium border border-gray-200 w-1/12">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-100"
                    aria-label={`Remove subject row ${row.id}`}
                  >
                    <span className="text-xl font-bold">&times;</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAddRow}
        className="text-sm xl:text-base text-blue-600 hover:text-blue-800 self-start pt-4"
      >
        + Click to add extra subject
      </button>
    </>
  );
};

export default SubjectTable;