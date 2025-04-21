import { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setDownloadableData, ColumnDefinition } from '../../../store/slices/downloadableDataSlice';
import { useCohortCalculatedData } from '../../../hooks/useCohortCalculatedData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AtarDistributionRow {
  threshold: number;
  count: number;
  percentage: string;
}

// ATAR Histogram data structure
interface HistogramBucket {
  range: string; // e.g., "30-40"
  count: number;
  percentage: number;
}

// Define Columns for CSV Export (for the distribution table only)
const SCHOOL_SUMMARY_DIST_COLUMNS: ColumnDefinition[] = [
  { key: 'threshold', header: 'ATAR greater than or equal to' },
  { key: 'count', header: 'No. of students' },
  { key: 'percentage', header: '% of ATAR eligible students' }, // Ensure header matches CSV needs
];

const SchoolSummaryView = () => {
  const dispatch: AppDispatch = useDispatch(); // Get dispatch function
  const { data, loading, error } = useSelector((state: RootState) => state.cohort);

  const { processedStudentScores } = useCohortCalculatedData({
    data,
    mappingsLoaded: true,
    variation: "0",
  });

  const summaryData = useMemo(() => {
    if (!processedStudentScores || Object.keys(processedStudentScores).length === 0) {
      return { eligibleCount: 0, medianAtar: null, distribution: [], histogramData: [] };
    }

    const eligibleStudents = Object.values(processedStudentScores)
        .filter(scores => typeof scores.displayAtar === 'number')
        .map(scores => scores.displayAtar as number);

    const eligibleCount = eligibleStudents.length;

    if (eligibleCount === 0) {
        return { eligibleCount: 0, medianAtar: null, distribution: [], histogramData: [] };
    }

    const sortedAtars = [...eligibleStudents].sort((a, b) => a - b);
    let medianAtar: number;
    const mid = Math.floor(eligibleCount / 2);
    if (eligibleCount % 2 === 0) {
      medianAtar = (sortedAtars[mid - 1] + sortedAtars[mid]) / 2;
    } else {
      medianAtar = sortedAtars[mid];
    }

    const thresholds = [99, 95, 90, 80, 70, 60];
    const distribution: AtarDistributionRow[] = thresholds.map(threshold => {
      const count = eligibleStudents.filter(atar => atar >= threshold).length;
      const percentage = ((count / eligibleCount) * 100).toFixed(2);
      // Store percentage without the '%' sign for easier CSV handling
      return { threshold, count, percentage }; 
    });

    // Create histogram data with buckets in 5s, respecting ATAR's .05 increments
    const histogramBuckets: HistogramBucket[] = [];
    for (let lowerBound = 0; lowerBound < 100; lowerBound += 5) {
      const upperBound = lowerBound + 5;
      // Format lower bound with 2 decimal places, always showing .00
      const formattedLowerBound = lowerBound.toFixed(2);
      // Upper bound is exclusive and should be .95 (since ATARs are in .05 increments)
      const formattedUpperBound = (upperBound - 0.05).toFixed(2);
      
      const count = eligibleStudents.filter(
        atar => atar >= lowerBound && atar < upperBound
      ).length;
      const percentage = (count / eligibleCount) * 100;
      histogramBuckets.push({
        range: `${formattedLowerBound}-${formattedUpperBound}`,
        count,
        percentage
      });
    }
    
    // Add the 100 bucket (for ATARs that are exactly 100)
    const countOf100 = eligibleStudents.filter(atar => atar === 100).length;
    if (countOf100 > 0) {
      histogramBuckets.push({
        range: "100",
        count: countOf100,
        percentage: (countOf100 / eligibleCount) * 100
      });
    }

    // Find the first non-empty bucket to determine where to start the x-axis
    const firstNonEmptyIndex = histogramBuckets.findIndex(bucket => bucket.count > 0);
    const filteredHistogramData = firstNonEmptyIndex > 0 
      ? histogramBuckets.slice(firstNonEmptyIndex) 
      : histogramBuckets;

    return {
      eligibleCount,
      medianAtar: medianAtar.toFixed(2),
      distribution,
      histogramData: filteredHistogramData,
    };
  }, [processedStudentScores]);

  // Effect to update downloadable data in Redux state (only for distribution table)
  useEffect(() => {
      // Add % sign back for CSV if desired, or handle in export utility if needed
      // For simplicity, we export the raw percentage number from the state.
      const csvData = summaryData.distribution.map(row => ({
          ...row,
          percentage: `${row.percentage}%` // Add % sign for CSV output
      })); 

      dispatch(setDownloadableData({
          columns: SCHOOL_SUMMARY_DIST_COLUMNS,
          data: csvData, // Use the modified data with '%' sign
          filename: 'school-summary-distribution.csv' // Specific filename
      }));
  }, [summaryData.distribution, dispatch]); // Dependency: distribution data

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded-md shadow-sm">
          <p className="font-medium text-sm">{`ATAR Range: ${label}`}</p>
          <p className="text-sm">{`Count: ${payload[0].payload.count} students`}</p>
          <p className="text-sm">{`Percentage: ${payload[0].payload.percentage.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="text-center p-4">Loading Student Data...</div>;
  }
  if (error) {
    return <div className="text-red-600 p-4">Error loading cohort data: {error}</div>;
  }
  if (!data || !data.students.length) {
      return (
          <div className="text-center p-4">
              No student data available. Please upload data first.
          </div>
      );
  }
  if (summaryData.eligibleCount === 0 && processedStudentScores && Object.keys(processedStudentScores).length > 0) {
    return (
      <div className="text-center p-4">
        No ATAR eligible students found in the processed data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium text-gray-500 mb-2">ATAR Eligible Students</h3>
          <p className="text-4xl font-bold text-blue-600">{summaryData.eligibleCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 shadow">
          <h3 className="text-lg font-medium text-gray-500 mb-2">Median ATAR</h3>
          <p className="text-4xl font-bold text-blue-600">
            {summaryData.medianAtar ?? 'N/A'}
          </p>
        </div>
      </div>

      {/* ATAR Distribution Histogram and Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATAR Distribution Table */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">ATAR Distribution</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                    {/* Use column definitions for headers */}
                    {SCHOOL_SUMMARY_DIST_COLUMNS.map((col) => (
                        <th 
                            key={col.key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaryData.distribution.length > 0 ? (
                  summaryData.distribution.map((row) => (
                    <tr key={row.threshold}>
                        {/* Use column definitions to render cells */}
                        {SCHOOL_SUMMARY_DIST_COLUMNS.map((col) => (
                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {/* Add % sign back for display only */} 
                                {col.key === 'percentage' ? `${row[col.key]}%` : row[col.key as keyof AtarDistributionRow]}
                            </td>
                        ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={SCHOOL_SUMMARY_DIST_COLUMNS.length} className="px-6 py-4 text-center text-sm text-gray-500">
                      No distribution data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ATAR Distribution Histogram */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">ATAR Distribution Histogram</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={summaryData.histogramData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barGap={2}
              barCategoryGap={1}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
                label={{ value: 'ATAR', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle' } }}
              />
              <YAxis
                label={{ value: 'Percentage of Students (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" name="Percentage" fill="#1f77b4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SchoolSummaryView; 