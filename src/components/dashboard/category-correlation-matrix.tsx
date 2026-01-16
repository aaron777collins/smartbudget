'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeframeValue } from './timeframe-selector';
import { getMonthsFromTimeframe } from '@/lib/timeframe';

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

    // Calculate dimensions
    const cellSize = 70;
    const labelSize = 150;
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

    // Create color scale for correlation (0 = white, 1 = dark blue)
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, 1]);

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
      .attr('fill', '#374151')
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
      .attr('fill', '#374151')
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
        if (d.correlation === 0) return '#F3F4F6';
        return colorScale(d.correlation);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#2563EB')
          .attr('stroke-width', 3);

        // Show tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'correlation-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
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
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        // Remove tooltip
        d3.selectAll('.correlation-tooltip').remove();
      });

    // Add correlation value text for higher correlations
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
      .attr('fill', d => d.correlation > 0.6 ? '#fff' : '#374151')
      .attr('pointer-events', 'none')
      .text(d => (d.correlation * 100).toFixed(0) + '%');

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - margin.right;
    const legendY = 20;

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => d + '%');

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Draw gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.interpolateBlues(0));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.interpolateBlues(1));

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
      .attr('fill', '#374151')
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
          <Skeleton className="h-[500px] w-full" />
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
