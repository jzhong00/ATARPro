import { useNavigate } from 'react-router-dom';
import { useEquivalentCalculator } from '../../hooks/useEquivalentCalculator';

/**
 * Equivalent Calculator Component
 * 
 * Allows users to input a score for a specific subject and see the 
 * equivalent scores required in other subjects to achieve the same scaled score.
 * Also provides options to compare against randomly selected subjects and 
 * navigate to view the selected subjects on the scaling graphs.
 */
const EquivalentCalculator = () => {
  const navigate = useNavigate();
  
  const {
    subjects,
    score,
    selectedSubject,
    comparisonSubjects,
    isLoading,
    error,
    equivalentScores,
    sourceScaledScore,
    handleScoreChange,
    handleSubjectChange,
    handleComparisonSubjectChange,
    handleRandomSubjects,
    handleClearComparisons,
    formatScore,
    getScaledScoreDisplay,
    getScoreClasses
  } = useEquivalentCalculator();

  // Function to prepare URL for scaling graphs with selected subjects
  const getScalingGraphsUrl = () => {
    // Collect all selected subjects (primary + comparisons)
    const allSelectedSubjects = [selectedSubject, ...comparisonSubjects].filter(Boolean);
    
    // Create a URL-friendly string of selected subjects
    const subjectParam = encodeURIComponent(JSON.stringify(allSelectedSubjects));
    
    // Return the URL with the subjects as a query parameter
    return `/scaling-graphs?subjects=${subjectParam}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  // Check if we have at least one valid subject selected for enabling actions
  const hasSelectedSubjects = selectedSubject || comparisonSubjects.some(subject => subject);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong> <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* ==== Main Input Row ==== */}
          {/* Allows selection of the source score and subject */}
          <div className="bg-white border-b border-gray-200 pb-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-700 text-sm font-medium">A score of</span>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => handleScoreChange(e.target.value)}
                placeholder="0-100"
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <span className="text-gray-700 text-sm font-medium">in</span>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="min-w-52 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {sourceScaledScore !== null && score && selectedSubject && (
                <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-mono text-gray-700 text-center">
                  scaled: {sourceScaledScore.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          
          {/* ==== Comparison Section ==== */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-700 text-sm font-medium">Equivalent to:</p>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <a
                  href={hasSelectedSubjects ? getScalingGraphsUrl() : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-block text-center"
                  onClick={(e) => !hasSelectedSubjects && e.preventDefault()}
                  style={{ opacity: hasSelectedSubjects ? 1 : 0.5, cursor: hasSelectedSubjects ? 'pointer' : 'not-allowed' }}
                >
                  View in Scaling Graphs
                </a>
                <button 
                  onClick={handleRandomSubjects}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={!score || !selectedSubject}
                >
                  Random Subjects
                </button>
                <button 
                  onClick={handleClearComparisons}
                  className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={comparisonSubjects.every(s => s === '')}
                >
                  Clear Comparisons
                </button>
              </div>
            </div>
            
            {/* Column headers for comparison results */}
            <div className="grid grid-cols-3 gap-3 text-xs font-medium text-gray-500 px-2 mb-2">
              <div>Score</div>
              <div>Subject</div>
              <div>Scaled</div>
            </div>
            
            {/* Comparison Subject Rows */}
            <div className="space-y-2">
              {comparisonSubjects.map((subject, index) => {
                const sourceScoreNum = Number(score);
                const equivalentScore = equivalentScores[index];
                const { better, worse } = getScoreClasses(equivalentScore, sourceScoreNum);
                const scaledScoreValue = subject && equivalentScore !== null ? 
                  getScaledScoreDisplay(subject, equivalentScore) : '';
                const isRowInactive = !subject;
                
                // Determine classes based on score comparison for visual feedback
                const resultBoxClasses = `flex items-center justify-center rounded-md px-3 py-1 text-sm font-mono text-center transition-colors duration-200 ${
                  equivalentScore === 'Not\nPossible' 
                    ? 'text-sm font-medium text-red-700 text-center bg-red-50 border border-red-500' 
                    : better
                      ? 'border border-green-500 text-green-700 bg-green-50' 
                      : worse
                        ? 'border border-red-500 text-red-700 bg-red-50'
                        : 'border border-gray-300 bg-white'
                }`;
                
                const selectClasses = `px-3 py-1.5 border rounded-md shadow-sm bg-white text-sm transition-colors duration-200 ${
                  isRowInactive
                    ? 'border-gray-300'
                    : better
                      ? 'border-green-500 text-green-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500' 
                      : worse
                        ? 'border-red-500 text-red-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                }`;
                
                return (
                  <div key={index} className={`grid grid-cols-3 gap-3 items-center ${isRowInactive ? 'opacity-60' : ''}`}>
                    <div className={resultBoxClasses}>
                      {equivalentScore === 'Not\nPossible' 
                        ? 'Not possible'
                        : equivalentScore !== null && formatScore(equivalentScore)}
                    </div>
                    <select
                      value={subject}
                      onChange={(e) => handleComparisonSubjectChange(index, e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Select a subject</option>
                      {subjects.map(subj => (
                        <option 
                          key={subj} 
                          value={subj}
                          disabled={subj === selectedSubject || 
                                  (comparisonSubjects.includes(subj) && subj !== subject)}
                        >
                          {subj}
                        </option>
                      ))}
                    </select>
                    {scaledScoreValue ? (
                      <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded text-center">
                        {equivalentScore === 'Not\nPossible'
                          ? `Max: ${scaledScoreValue}`
                          : scaledScoreValue
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm text-center">–</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquivalentCalculator; 