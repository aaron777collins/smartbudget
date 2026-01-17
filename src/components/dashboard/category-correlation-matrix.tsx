'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimeframeValue } from './timeframe-selector';
import { getMonthsFromTimeframe } from '@/lib/timeframe';
import { getCurrentTheme, getExtendedChartColors } from '@/lib/design-tokens';

interface CorrelationData {
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  matrix: Array<{
    category1: string;
    category1Id: string;
    category1Color: string;
    category2: string;
    category2Id: string;
    category2Color: string;
    correlation: number;
    cooccurrence: number;
  }>;
  metadata: {
    months: number;
    totalMonthsWithData: number;
    maxCooccurrence: number;
  };
}

interface CategoryCorrelationMatrixProps {
  timeframe: TimeframeValue;
}

export function CategoryCorrelationMatrix({ timeframe }: CategoryCorrelationMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const months = Math.min(getMonthsFromTimeframe(timeframe), 6); // Cap at 6 months for correlation
        const params = new URLSearchParams({ months: months.toString() });
        const response = await fetch(`/api/dashboard/category-correlation?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch correlation data');
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
    if (!data || !svgRef.current || !containerRef.current || data.categories.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Get container dimensions
    const container = containerRef.current;
    const containerWidth = container.clientWidth;

    // Calculate responsive dimensions based on viewport
    const isMobile = containerWidth < 640;
    const isTablet = containerWidth >= 640 && containerWidth < 1024;
    const cellSize = isMobile ? 50 : isTablet ? 60 : 70;
    const labelSize = isMobile ? 100 : 150;
    const margin = { top: labelSize, right: 20, bottom: 20, left: labelSize };

    const categories = data.categories;
    const n = categories.length;

    const width = labelSize + n * cellSize + margin.right;
    const height = margin.top + n * cellSize + margin.bottom;

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
    // We'll use a gradient from a light base color to primary blue for correlation strength
    // 0% correlation = very light/transparent, 100% correlation = strong primary blue
    const baseColor = theme === 'dark' ? 'hsl(217, 20%, 25%)' : 'hsl(217, 20%, 95%)';
    const primaryColor = aiceoColors[0]; // Primary blue

    const customInterpolator = (t: number): string => {
      return d3.interpolateHsl(baseColor, primaryColor)(t);
    };

    // Create color scale for correlation (0 = light, 1 = strong primary)
    const colorScale = d3
      .scaleSequential(customInterpolator)
      .domain([0, 1]);

    // Get theme-aware text color
    const textColor = theme === 'dark' ? '#D1D5DB' : '#374151';

    // Draw column labels (top)
    g.selectAll('.col-label')
      .data(categories)
      .join('text')
      .attr('class', 'col-label')
      .attr('x', (d, i) => margin.left + i * cellSize + cellSize / 2)
      .attr('y', labelSize - 10)
      .attr('text-anchor', 'end')
      .attr('transform', (d, i) => {
        const x = margin.left + i * cellSize + cellSize / 2;
        const y = labelSize - 10;
        return `rotate(-45, ${x}, ${y})`;
      })
      .attr('font-size', '11px')
      .attr('fill', textColor)
      .text(d => d.name);

    // Draw row labels (left)
    g.selectAll('.row-label')
      .data(categories)
      .join('text')
      .attr('class', 'row-label')
      .attr('x', margin.left - 10)
      .attr('y', (d, i) => margin.top + i * cellSize + cellSize / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', textColor)
      .text(d => d.name);

    // Create matrix cells
    const cells: Array<{
      row: number;
      col: number;
      correlation: number;
      cooccurrence: number;
      cat1: string;
      cat2: string;
    }> = [];

    categories.forEach((cat1, i) => {
      categories.forEach((cat2, j) => {
        const matrixItem = data.matrix.find(
          m => m.category1Id === cat1.id && m.category2Id === cat2.id
        );
        cells.push({
          row: i,
          col: j,
          correlation: matrixItem?.correlation || 0,
          cooccurrence: matrixItem?.cooccurrence || 0,
          cat1: cat1.name,
          cat2: cat2.name,
        });
      });
    });

    // Get theme-aware cell colors
    const emptyCellColor = theme === 'dark' ? '#1F2937' : '#F3F4F6';
    const strokeColor = theme === 'dark' ? '#374151' : '#fff';
    const hoverStrokeColor = primaryColor;

    // Draw cells
    g.selectAll('.matrix-cell')
      .data(cells)
      .join('rect')
      .attr('class', 'matrix-cell')
      .attr('x', d => margin.left + d.col * cellSize + 1)
      .attr('y', d => margin.top + d.row * cellSize + 1)
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('fill', d => {
        if (d.correlation === 0) return emptyCellColor;
        return colorScale(d.correlation);
      })
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', hoverStrokeColor)
          .attr('stroke-width', 3);

        // Show tooltip with theme-aware colors
        const tooltipBg = theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)';
        const tooltipText = theme === 'dark' ? '#D1D5DB' : 'white';

        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'correlation-tooltip')
          .style('position', 'absolute')
          .style('background', tooltipBg)
          .style('color', tooltipText)
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`
            <div><strong>${d.cat1}</strong> × <strong>${d.cat2}</strong></div>
            <div>Co-occurrence: ${d.cooccurrence} month(s)</div>
            <div>Correlation: ${(d.correlation * 100).toFixed(0)}%</div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2);

        // Remove tooltip
        d3.selectAll('.correlation-tooltip').remove();
      });

    // Add correlation value text for higher correlations
    // Use theme-aware contrasting text for high correlations (darker cells)
    const lightTextColor = theme === 'dark' ? '#F3F4F6' : '#fff';

    g.selectAll('.cell-text')
      .data(cells.filter(d => d.correlation > 0.3))
      .join('text')
      .attr('class', 'cell-text')
      .attr('x', d => margin.left + d.col * cellSize + cellSize / 2)
      .attr('y', d => margin.top + d.row * cellSize + cellSize / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', d => d.correlation > 0.6 ? lightTextColor : textColor)
      .attr('pointer-events', 'none')
      .text(d => (d.correlation * 100).toFixed(0) + '%');

    // Add legend (responsive sizing)
    const legendWidth = isMobile ? 150 : 200;
    const legendHeight = 20;
    const legendX = isMobile ? margin.left : (width - legendWidth - margin.right);
    const legendY = isMobile ? (height - margin.bottom - 50) : 20;

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => d + '%');

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Draw gradient using AICEO colors
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', baseColor);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', primaryColor);

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#correlation-gradient)');

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('font-size', '10px');

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', textColor)
      .text('Co-occurrence Strength');

  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Correlation Matrix</CardTitle>
          <CardDescription>Categories that tend to occur together</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-muted-foreground">Loading correlation data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Correlation Matrix</CardTitle>
          <CardDescription>Categories that tend to occur together</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
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
        <CardTitle>Category Correlation Matrix</CardTitle>
        <CardDescription>
          Categories that tend to occur together in the same months (Last {data.metadata.months} months)
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
