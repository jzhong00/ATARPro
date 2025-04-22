import React, { useState, useEffect } from 'react';
import type { SubjectRow } from '../../../types/calculator';
import type { ScalingResult } from '../../../utils/scaling';
import SubjectInput from '../../common/SubjectInput';
import type { SubjectMapping } from '../../../services/subjectMappingService';

interface ScaledScoresMap {
  get: (id: string) => {
    lower: ScalingResult | null;
    result: ScalingResult | null;
    upper: ScalingResult | null;
  } | undefined;
}

interface SETPlanSubjectTableProps {
  subjectRows: SubjectRow[];
  scaledScoresMap: ScaledScoresMap;
  allSubjects: SubjectMapping[];
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onSubjectChange: (id: string, value: string | null) => void;
  onRankChange: (id: string, value: string | null) => void;
  getFormattedScaledScore?: (row: SubjectRow) => string | number | null;
}

// Define rank options for each subject type
interface RankOptions {
  General: string[];
  Applied: string[];
  VET: string[];
}

const SETPlanSubjectTable: React.FC<SETPlanSubjectTableProps> = ({
  subjectRows,
  scaledScoresMap,
  allSubjects,
  onAddRow,
  onDeleteRow,
  onSubjectChange,
  onRankChange,
  getFormattedScaledScore
}) => {
  // State for rank options
  const [rankOptions, setRankOptions] = useState<RankOptions>({
    General: [],
    Applied: [],
    VET: []
  });

  // Load rank options from CSV
  useEffect(() => {
    const loadRankOptions = async () => {
      try {
        const response = await fetch('/data/SET_Plan_Rank_List.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch rank options: ${response.statusText}`);
        }

        const csvText = await response.text();
        
        // Use a simple line-by-line approach to parse the CSV
        const lines = csvText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        const options: RankOptions = {
          General: [],
          Applied: [],
          VET: []
        };
        
        // Process each line
        for (const line of lines) {
          const parts = line.split(',').map(part => part.trim());
          if (parts[0] === 'General') {
            options.General = parts.slice(1).filter(val => val !== '');
          } else if (parts[0] === 'Applied') {
            // For Applied subjects, get the values exactly as they appear in the CSV
            // without any modification or reordering
            options.Applied = parts.slice(1).filter(val => val !== '');
          } else if (parts[0] === 'VET') {
            options.VET = parts.slice(1).filter(val => val !== '');
          }
        }
        
        setRankOptions(options);
      } catch (error) {
        // Consider better error handling
      }
    };

    loadRankOptions();
  }, []);

  // Create an adapter for the SubjectInput onChange
  const handleSubjectInputChange = (rowId: string, value: string) => {
    // Convert empty string to null for the parent component's handler
    onSubjectChange(rowId, value === '' ? null : value);
  };

  // Helper to determine subject type
  const getSubjectType = (subjectName: string | null): 'General' | 'Applied' | 'VET' | null => {
    if (!subjectName) return null;
    
    const subject = allSubjects.find(s => s.Subject_display === subjectName);
    if (!subject) return null;
    
    return subject.Type as 'General' | 'Applied' | 'VET';
  };

  // Helper to format result range display
  const getFormattedResultRange = (row: SubjectRow): string => {
    if (!row.resultRange) return '-';
    
    const subjectType = getSubjectType(row.subject);
    
    // For Applied subjects, add spaces to match the rank display format
    if (subjectType === 'Applied') {
      const parts = row.resultRange.split('-');
      if (parts.length === 2) {
        return `${parts[0]} - ${parts[1]}`;
      }
    }
    
    return row.resultRange;
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">Subject</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Rank</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Result Range</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Scaled Range</th>
              <th scope="col" className="px-1 py-3 w-1/12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjectRows.map((row) => (
              <tr key={row.id}>
                {/* Subject Input */}
                <td className="px-4 py-2 whitespace-nowrap border border-gray-200 w-5/12">
                  <SubjectInput
                    value={row.subject}
                    subjects={allSubjects}
                    onChange={(val) => handleSubjectInputChange(row.id, val)}
                  />
                </td>
                
                {/* Rank Input */}
                <td className="px-3 py-2 whitespace-nowrap border border-gray-200 w-2/12">
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded shadow-sm text-sm"
                    value={row.rank || ''}
                    onChange={(e) => onRankChange(row.id, e.target.value || null)}
                    disabled={!row.subject}
                  >
                    <option value="">Select Rank...</option>
                    {(() => {
                      // Get the subject type
                      const type = getSubjectType(row.subject);
                      
                      if (!type) return null;
                      
                      // Special handling for Applied subjects to ensure correct order
                      if (type === 'Applied') {
                        return (
                          <>
                            <option value="B - A">B - A</option>
                            <option value="B - C">B - C</option>
                          </>
                        );
                      }
                      
                      // For other subject types, use the standard approach
                      const options = rankOptions[type] || [];
                      return options.map((option) => (
                        <option key={`${type}-${option}`} value={option}>
                          {option}
                        </option>
                      ));
                    })()}
                  </select>
                </td>
                
                {/* Result Range (Output) */}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center border border-gray-200 w-2/12">
                  {getFormattedResultRange(row)}
                </td>

                {/* Scaled Score Range (Output) */}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center border border-gray-200 w-2/12">
                  {getFormattedScaledScore ? (
                    getFormattedScaledScore(row) || '-'
                  ) : (
                    (() => {
                      const scaledRange = scaledScoresMap.get(row.id);
                      if (!scaledRange) return '-';

                      // Helper to format a single score or error
                      const formatScore = (scoreResult: ScalingResult | null): React.ReactNode => {
                        if (scoreResult === null) return '-';
                        if (scoreResult.error) return <span title={scoreResult.error} className="text-red-500">Err</span>;
                        return scoreResult.scaledScore.toFixed(1);
                      };

                      const lowerStr = formatScore(scaledRange.lower);
                      const upperStr = formatScore(scaledRange.upper);
                      return <>{lowerStr} - {upperStr}</>;
                    })()
                  )}
                </td>
                
                {/* Delete Button */}
                <td className="px-1 py-2 whitespace-nowrap text-center text-sm font-medium border border-gray-200 w-1/12">
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
        className="text-sm text-blue-600 hover:text-blue-800 self-start"
      >
        + Click to add extra subject
      </button>
    </>
  );
};

export default SETPlanSubjectTable; 