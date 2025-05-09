import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LegendProps } from 'recharts';
import { Selection, ScalingRow, DataPoint } from '../../utils/scalingDataUtils'; // Import types from utils
import CustomTooltip from './CustomTooltip';

// Define Props for the component
interface ScalingGraphProps {
  selections: Selection[];
  allScalingData: ScalingRow[]; // Receive all data as a prop
}

/**
 * Component for visualizing the scaling graph.
 * Receives all scaling data and current selections as props.
 */
const ScalingGraph = ({ selections, allScalingData }: ScalingGraphProps) => {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  // isLoading might be less relevant here if parent handles initial load, 
  // but we keep it for the transformation step.
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    // Only process data if we have the necessary scaling data and selections
    if (selections.length === 0 || !allScalingData || allScalingData.length === 0) {
      setChartData([]);
      setIsLoading(false); 
      return;
    }

    setIsLoading(true); // Start loading state for transformation

    try {
      // Use the allScalingData prop directly instead of fetching
      const scalingData = allScalingData; 
      
      const rawScores = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
      
      // Create data points for each raw score based on current selections
      const points = rawScores.map(rawScore => {
        const point: DataPoint = { rawScore };
        
        selections.forEach(({ subject, year }) => {
          // Find the row in the *provided* scalingData
          const row = scalingData.find(r => r.Subject === subject && r.Year === year); 
          if (row) {
            const rawScoreStr = rawScore.toString();
            const scaledScoreValue = row[rawScoreStr];
            if (scaledScoreValue !== undefined && scaledScoreValue !== '') {
              const scaledScore = parseFloat(scaledScoreValue);
              if (!isNaN(scaledScore)) {
                point[`${subject} (${year})`] = scaledScore;
              }
            }
          }
        });
        
        return point;
      });

      setChartData(points);
    } catch (error) {
      console.error('Error processing graph data:', error); // Removed
      setChartData([]); // Clear data on error
    } finally {
      setIsLoading(false); // Finish loading state
    }
  // Depend on selections and the main data prop
  }, [selections, allScalingData]); 

  // Decide what to show based on state
  if (!allScalingData || allScalingData.length === 0) {
     // Optional: Show a message if the parent hasn't passed data yet
     return <div className="flex items-center justify-center h-full text-gray-500">Waiting for scaling data...</div>;
  }
  
  if (isLoading) {
    // Indicates data *transformation* is happening
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      </div>
      ); 
  }

  if (selections.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Select subjects and years to view scaling graphs</div>;
  }

  if (chartData.length === 0 && selections.length > 0) {
     // This might happen if processing failed or selections don't match data
     return <div className="flex items-center justify-center h-full text-red-500">Could not generate graph for current selections.</div>;
  }

  // Fixed set of colors for lines
  const colors = ['#2196F3', '#4CAF50', '#F44336', '#9C27B0', '#FF9800', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#673AB7'];

  // Custom scrollable legend component
  const ScrollableLegend = (props: LegendProps) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;
    return (
      <div
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          maxWidth: '150px',
          paddingRight: 0,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {payload.map((entry: any) => (
          <div key={entry.value} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{
              display: 'inline-block',
              width: 14,
              height: 4,
              backgroundColor: entry.color,
              marginRight: 2,
              borderRadius: 2
            }} />
            <span style={{ color: entry.color, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* Pass the processed chartData to the chart */}
        <LineChart data={chartData} margin={{ top: 15, right: 20, left: 5, bottom: 15 }}> 
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="rawScore"
            type="number"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            label={{ value: 'Raw Score', position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            label={{ value: 'Scaled Score', angle: -90, position: 'insideLeft', offset: 5 }}
          />
          <Tooltip
            cursor={false}
            content={<CustomTooltip />} // Uses the imported component
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle"
            content={<ScrollableLegend />}
            wrapperStyle={{ right: 0 }}
          />
          {selections.map((selection, index) => {
            const key = `${selection.subject} (${selection.year})`;
            return (
              <Line
                key={key}
                type="linear"
                dataKey={key}
                name={key}
                stroke={colors[index % colors.length]}
                dot={{ r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                strokeWidth={2}
                isAnimationActive={false} // Consider animation if preferred
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScalingGraph; 