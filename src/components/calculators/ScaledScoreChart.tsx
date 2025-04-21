// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps // Import TooltipProps for typing
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'; // Import types for tooltip payload
import type { ScaledScoreChartProps, ScaledScoreChartDataPoint } from '../../types/chart';
import './ScaledScoreChart.css'; // Assuming CSS file will be created

// --- Define Tooltip Props including rangeMode ---
interface CustomTooltipComponentProps extends TooltipProps<ValueType, NameType> {
  rangeMode: boolean;
}

// --- Add disableAnimation to props --- 
interface InternalChartProps extends ScaledScoreChartProps {
  disableAnimation?: boolean;
  skipMiddleValue?: boolean;
}

// Custom Tooltip Component (Typed)
const CustomTooltip: React.FC<CustomTooltipComponentProps> = ({ active, payload, label, rangeMode }) => {
  if (active && payload && payload.length) {
    // Accessing custom data properties from the payload
    const data = payload[0].payload as ScaledScoreChartDataPoint;
    return (
      <div className="scaled-score-chart-tooltip">
        <p className="tooltip-subject">{label}</p>
        {/* Use rangeMode prop directly for the condition */}
        {rangeMode ? (
          <>
            <p className="tooltip-lower">Lower: {data.lowerValue.toFixed(1)}</p>
            {/* Keep the logic to show middle only if distinct when in range mode */}
            {data.middleValue !== data.lowerValue && data.middleValue !== data.upperValue && (
              <p className="tooltip-middle">Result: <strong>{data.middleValue.toFixed(1)}</strong></p>
            )}
            <p className="tooltip-upper">Upper: {data.upperValue.toFixed(1)}</p>
          </>
        ) : (
          // Use middleValue for single score display for consistency
          <p className="tooltip-middle">Scaled Score: <strong>{data.middleValue.toFixed(1)}</strong></p>
        )}
      </div>
    );
  }

  return null;
};


// Main Chart Component
// --- Update props to include disableAnimation --- 
export const ScaledScoreChart: React.FC<InternalChartProps> = ({ 
  chartData, 
  rangeMode, 
  xAxisMin, 
  xAxisMax, 
  disableAnimation = false,
  skipMiddleValue = false 
}) => {

  // --- DEBUG LOGGING ---
  useEffect(() => {
    console.log("ScaledScoreChart Mounted");
  }, []);

  useEffect(() => {
    // Log when props influencing the visual output change
    console.log("ScaledScoreChart Props Updated:", 
      { 
        dataLength: chartData?.length,
        rangeMode: rangeMode, 
        xAxisMin: xAxisMin, 
        xAxisMax: xAxisMax,
        skipMiddleValue: skipMiddleValue
      }
    );
    // We assume Recharts handles its internal rendering after these props update.
    // A more robust solution might involve a callback from Recharts if available,
    // but for now, logging the prop update is the first step.
  }, [chartData, rangeMode, xAxisMin, xAxisMax, skipMiddleValue]);
  // --- END DEBUG LOGGING ---

  // Generate ticks for the X-axis based on xAxisMin and xAxisMax
  const xAxisTicks = React.useMemo(() => {
    const ticks = [];
    const internalMax = xAxisMax - xAxisMin; // Calculate internal max relative to internal 0
    // Generate ticks from 0 up to the internal maximum
    for (let tickValue = 0; tickValue <= internalMax; tickValue += 10) {
        // Ensure we don't push a tick greater than the calculated internal max
        if (tickValue <= internalMax) {
           ticks.push(tickValue);
        }
    }
    // Ensure the top boundary is included if not perfectly divisible by 10
    if (internalMax % 10 !== 0 && internalMax > 0) {
        if (ticks.length === 0 || internalMax > ticks[ticks.length - 1]) {
             ticks.push(internalMax);
        }
    }
    // Handle edge case where min=max, resulting in ticks [0]
    if (xAxisMin === xAxisMax && ticks.length === 0) {
        ticks.push(0);
    }
    return ticks;
  }, [xAxisMin, xAxisMax]); // Add xAxisMax dependency

  // Tick formatter for the X-axis to display actual scaled scores
  const xAxisTickFormatter = (value: number): string => `${value + xAxisMin}`;

  return (
    <div className="scaled-score-chart-container">
      <h3>Scaled Score {rangeMode ? 'Range' : ''}</h3>
      <ResponsiveContainer width="100%" height={40 + chartData.length * 45}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          barSize={25}
        >
          {/* Enable vertical grid lines alongside horizontal */}
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
          <XAxis
            type="number"
            domain={[0, xAxisMax - xAxisMin]}
            ticks={xAxisTicks}
            tickFormatter={xAxisTickFormatter}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="subject"
            width={100}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: '0.9em', fill: '#555' }}
            interval={0}
          />
          {/* Pass rangeMode to the CustomTooltip component */}
          <Tooltip content={<CustomTooltip rangeMode={rangeMode} />} cursor={{ fill: '#f5f5f5' }} />

          {/* Conditional Bar Rendering */}
          {rangeMode ? (
            <>
              {/* Transparent base for stacking */}
              <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={!disableAnimation} />
              
              {/* Only render middle bar if not skipping middle value */}
              {!skipMiddleValue && (
                <Bar dataKey="middle" stackId="a" fill="#aec7e8" isAnimationActive={!disableAnimation} />
              )}
              
              {/* Upper bar (always shown in range mode) */}
              <Bar dataKey="upper" stackId="a" fill="#1f77b4" radius={0} isAnimationActive={!disableAnimation} />
            </>
          ) : (
            /* --- Add isAnimationActive={!disableAnimation} --- */
            <Bar dataKey="base" fill="#1f77b4" radius={0} isAnimationActive={!disableAnimation} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 