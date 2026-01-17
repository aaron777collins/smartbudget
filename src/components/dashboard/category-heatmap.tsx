'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { TimeframeValue } from './timeframe-selector';
import { getMonthsFromTimeframe } from '@/lib/timeframe';
import { getCurrentTheme, getExtendedChartColors } from '@/lib/design-tokens';

interface HeatmapData {
  data: Array<{
    category: string;
    categoryId: string;
    color: string;
    months: Array<{
      month: string;
      monthDate: string;
      amount: number;
    }>;
  }>;
  scale: {
    min: number;
    max: number;
  };
  period: {
    months: number;
  };
}

interface CategoryHeatmapProps {
  timeframe: TimeframeValue;
}

export function CategoryHeatmap({ timeframe }: CategoryHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const months = getMonthsFromTimeframe(timeframe);
        const params = new URLSearchParams({ months: months.toString() });
        const response = await fetch(`/api/dashboard/category-heatmap?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch heatmap data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeframe]);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current || data.data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Get container dimensions
    const container = containerRef.current;
    const containerWidth = container.clientWidth;

    // Calculate responsive dimensions based on viewport
    const isMobile = containerWidth < 640;
    const isTablet = containerWidth >= 640 && containerWidth < 1024;
    const cellSize = isMobile ? 45 : isTablet ? 50 : 60;
    const categoryLabelWidth = isMobile ? 120 : 180;
    const monthLabelHeight = isMobile ? 50 : 60;
    const margin = { top: monthLabelHeight, right: 20, bottom: 20, left: categoryLabelWidth };

    const categories = data.data;
    const monthCount = categories[0]?.months.length || 0;

    const width = categoryLabelWidth + monthCount * cellSize + margin.right;
    const height = margin.top + categories.length * cellSize + margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', Math.max(containerWidth, width))
      .attr('height', height)
      .attr('viewBox', `0 0 ${Math.max(containerWidth, width)} ${height}`);

    const g = svg.append('g');

    // Get theme colors for AICEO palette
    const theme = getCurrentTheme();
    const aiceoColors = getExtendedChartColors(theme);

    // Create a custom interpolator using AICEO colors
    // We'll use a gradient from the first color (low values) to the fourth color (high values)
    // to create a visually appealing sequential scale
    const lowColor = aiceoColors[1];  // Emerald for low spending
    const midColor = aiceoColors[2];  // Amber for medium spending
    const highColor = aiceoColors[3]; // Rose for high spending

    const customInterpolator = (t: number): string => {
      if (t < 0.5) {
        // Interpolate between low and mid
        return d3.interpolateHsl(lowColor, midColor)(t * 2);
      } else {
        // Interpolate between mid and high
        return d3.interpolateHsl(midColor, highColor)((t - 0.5) * 2);
      }
    };

    // Create color scale using AICEO palette
    const colorScale = d3
      .scaleSequential(customInterpolator)
      .domain([0, data.scale.max]);

    // Get month labels
    const monthLabels = categories[0]?.months.map(m => m.month) || [];

    // Get theme-aware text color
    const textColor = theme === 'dark' ? '#D1D5DB' : '#374151';

    // Draw month labels
    g.selectAll('.month-label')
      .data(monthLabels)
      .join('text')
      .attr('class', 'month-label')
      .attr('x', (d, i) => margin.left + i * cellSize + cellSize / 2)
      .attr('y', monthLabelHeight - 10)
      .attr('text-anchor', 'end')
      .attr('transform', (d, i) => {
        const x = margin.left + i * cellSize + cellSize / 2;
        const y = monthLabelHeight - 10;
        return `rotate(-45, ${x}, ${y})`;
      })
      .attr('font-size', '11px')
      .attr('fill', textColor)
      .text(d => d);

    // Draw category labels
    g.selectAll('.category-label')
      .data(categories)
      .join('text')
      .attr('class', 'category-label')
      .attr('x', margin.left - 10)
      .attr('y', (d, i) => margin.top + i * cellSize + cellSize / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', textColor)
      .text(d => d.category);

    // Draw cells
    categories.forEach((category, categoryIndex) => {
      category.months.forEach((month, monthIndex) => {
        const cell = g.append('g')
          .attr('class', 'heatmap-cell')
          .attr('transform', `translate(${margin.left + monthIndex * cellSize}, ${margin.top + categoryIndex * cellSize})`);

        // Get theme-aware empty cell color and stroke color
        const emptyCellColor = theme === 'dark' ? '#1F2937' : '#F3F4F6';
        const strokeColor = theme === 'dark' ? '#374151' : '#fff';
        const hoverStrokeColor = aiceoColors[0]; // Primary blue for hover

        // Draw rectangle
        cell
          .append('rect')
          .attr('width', cellSize - 2)
          .attr('height', cellSize - 2)
          .attr('x', 1)
          .attr('y', 1)
          .attr('fill', month.amount === 0 ? emptyCellColor : colorScale(month.amount))
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2)
          .attr('rx', 4)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            d3.select(this)
              .attr('stroke', hoverStrokeColor)
              .attr('stroke-width', 3);

            // Show tooltip with theme-aware colors
            const tooltipBg = theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)';
            const tooltipText = theme === 'dark' ? '#D1D5DB' : 'white';

            const tooltip = d3.select('body')
              .append('div')
              .attr('class', 'heatmap-tooltip')
              .style('position', 'absolute')
              .style('background', tooltipBg)
              .style('color', tooltipText)
              .style('padding', '8px 12px')
              .style('border-radius', '6px')
              .style('font-size', '12px')
              .style('pointer-events', 'none')
              .style('z-index', '1000')
              .html(`
                <div><strong>${category.category}</strong></div>
                <div>${month.month}</div>
                <div>${formatCurrency(month.amount)}</div>
              `)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('stroke', strokeColor)
              .attr('stroke-width', 2);

            // Remove tooltip
            d3.selectAll('.heatmap-tooltip').remove();
          });

        // Add amount text for larger values
        if (month.amount > 0 && month.amount > data.scale.max * 0.1) {
          // Use theme-aware contrasting text for high values (darker cells), standard text for low values (lighter cells)
          const lightTextColor = theme === 'dark' ? '#F3F4F6' : '#fff';
          const cellTextColor = month.amount > data.scale.max * 0.5 ? lightTextColor : textColor;

          cell
            .append('text')
            .attr('x', cellSize / 2)
            .attr('y', cellSize / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', cellTextColor)
            .attr('pointer-events', 'none')
            .text(formatCurrency(month.amount, true));
        }
      });
    });

    // Add legend (responsive sizing)
    const legendWidth = isMobile ? 150 : 200;
    const legendHeight = 20;
    const legendX = isMobile ? margin.left : (width - legendWidth - margin.right);
    const legendY = isMobile ? (height - margin.bottom - 50) : 20;

    const legendScale = d3.scaleLinear()
      .domain([0, data.scale.max])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => formatCurrency(d as number, true));

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Draw gradient using AICEO colors
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lowColor);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', midColor);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', highColor);

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)');

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', '10px');

  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Heat Map</CardTitle>
          <CardDescription>Spending intensity by category over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Loading heatmap data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Heat Map</CardTitle>
          <CardDescription>Spending intensity by category over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">
              {error || 'No data available'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Spending Heat Map</CardTitle>
        <CardDescription>
          Spending intensity by category over the last {data.period.months} months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
