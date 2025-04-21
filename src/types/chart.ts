// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

/**
 * Represents a single data point for the ScaledScoreChart.
 * Values are structured for rendering with Recharts, potentially using stacking.
 */
export interface ScaledScoreChartDataPoint {
  subject: string;        // Subject name for the Y-axis label

  // --- Values for Recharts Bar rendering ---
  // These are typically relative to the chart's effective minimum (xAxisMin)
  // to handle dynamic axis ranges and stacking correctly.

  base: number;           // Represents the value from xAxisMin up to the lower score bound (or the single score if not in range mode)
  middle?: number;        // Represents the value from the lower score bound up to the middle score (only used in range mode)
  upper?: number;         // Represents the value from the middle score up to the upper score bound (only used in range mode)

  // --- Actual scaled scores for tooltips ---
  // These are the absolute scaled scores (0-100).

  lowerValue: number;     // The calculated scaled score for the lower result (or middle if not range mode)
  middleValue: number;    // The calculated scaled score for the primary result
  upperValue: number;     // The calculated scaled score for the upper result (or middle if not range mode)
}

/**
 * Props for the ScaledScoreChart component.
 */
export interface ScaledScoreChartProps {
  chartData: ScaledScoreChartDataPoint[]; // The processed data ready for Recharts
  rangeMode: boolean;                   // Indicates if range mode is active, affecting bar rendering
  xAxisMin: number;                     // The calculated minimum value for the X-axis display (e.g., 0, 10, 20...)
  xAxisMax: number;                     // Add the dynamic maximum prop
} 