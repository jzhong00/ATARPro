import React from 'react';

// Type Definition for props
export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  coordinate?: { x: number; y: number };
}

/**
 * Renders the custom tooltip for the scaling graph
 */
const CustomTooltip = ({ active, payload, label, coordinate }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0 || !coordinate) return null;

  // Find the closest point(s) to the mouse
  const { x, y } = coordinate;
  
  // Get the chart's container to calculate the scale
  const chartContainer = document.querySelector('.recharts-wrapper');
  if (!chartContainer) return null;
  
  const chartWidth = chartContainer.clientWidth - 40; // Subtract margins
  const chartHeight = chartContainer.clientHeight - 40; // Subtract margins
  
  const closePoints = payload.filter(entry => {
    if (!entry || typeof entry.value !== 'number') return false;

    // Convert the scaled score to y-coordinate
    // Chart is 0-100, with 0 at bottom, 100 at top
    const valuePercentage = entry.value / 100;
    const pointY = chartHeight - (valuePercentage * chartHeight) + 10; // Add top margin
    
    // Calculate vertical distance from mouse to point
    const distanceAbove = pointY - y;  // Positive when mouse is above point
    const distanceBelow = y - pointY;  // Positive when mouse is below point
    
    // Show points that are within 10 pixels above or below
    return distanceAbove < 10 && distanceAbove > 0 || distanceBelow < 10 && distanceBelow > 0;
  });

  if (closePoints.length === 0) return null;

  return (
    <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
      {closePoints.map((entry, index) => {
        const value = typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value;
        return (
          <div key={entry.dataKey} className={`${index === 0 ? '' : 'mt-2 pt-2 border-t border-gray-200'}`}>
            <p className="m-0 font-medium" style={{ color: entry.color }}>{entry.dataKey}</p>
            <p className="mt-1 mb-0">Raw Score: {label}</p>
            <p className="mt-1 mb-0">Scaled Score: {value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CustomTooltip; 