'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { TimeframeValue } from './timeframe-selector';
import { getMonthsFromTimeframe } from '@/lib/timeframe';
import { getCurrentTheme, getChartColors, getChartColorByIndex } from '@/lib/design-tokens';

interface SankeyData {
  nodes: Array<{ id: string; name: string; color?: string }>;
  links: Array<{ source: number; target: number; value: number }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    period: {
      start: string;
      end: string;
      months: number;
    };
  };
}

interface ExtendedSankeyNode extends SankeyNode<{}, {}> {
  id?: string;
  name?: string;
  color?: string;
}

interface ExtendedSankeyLink extends SankeyLink<ExtendedSankeyNode, {}> {
  value: number;
  width?: number;
  source: ExtendedSankeyNode;
  target: ExtendedSankeyNode;
}

// Type for the computed sankey graph
interface SankeyGraph {
  nodes: ExtendedSankeyNode[];
  links: ExtendedSankeyLink[];
}

interface CashFlowSankeyProps {
  timeframe: TimeframeValue;
}

export function CashFlowSankey({ timeframe }: CashFlowSankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const months = getMonthsFromTimeframe(timeframe);
        const params = new URLSearchParams({ months: months.toString() });
        const response = await fetch(`/api/dashboard/cash-flow-sankey?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch cash flow data');
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
    if (!data || !svgRef.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Get theme colors
    const theme = getCurrentTheme();
    const colors = getChartColors(theme);

    // Create a mapping of node index to AICEO color
    const nodeColorMap = new Map<number, string>();
    data.nodes.forEach((node, index) => {
      nodeColorMap.set(index, getChartColorByIndex(index, theme));
    });

    // Get container dimensions
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;

    // Responsive margins - smaller margins on mobile
    const isMobile = width < 640;
    const margin = {
      top: 20,
      right: isMobile ? 60 : 150,
      bottom: 20,
      left: isMobile ? 60 : 150
    };

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Prepare data for d3-sankey
    const sankeyData = {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };

    // Create Sankey layout
    const sankeyGenerator = sankey<ExtendedSankeyNode, ExtendedSankeyLink>()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    const graph = sankeyGenerator(sankeyData as SankeyGraph) as SankeyGraph;
    const { nodes, links } = graph;

    // Add links
    g.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d: ExtendedSankeyLink) => {
        // Find source node index and use AICEO color
        const sourceNode = d.source;
        const sourceIndex = nodes.findIndex((n) => n === sourceNode);
        return nodeColorMap.get(sourceIndex) || colors.linkDefault;
      })
      .attr('stroke-width', (d: ExtendedSankeyLink) => Math.max(1, d.width || 0))
      .attr('opacity', 0.4)
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 0.7);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.4);
      })
      .append('title')
      .text((d: ExtendedSankeyLink) => `${formatCurrency(d.value)}`);

    // Add nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g');

    node
      .append('rect')
      .attr('x', (d: ExtendedSankeyNode) => d.x0 ?? 0)
      .attr('y', (d: ExtendedSankeyNode) => d.y0 ?? 0)
      .attr('height', (d: ExtendedSankeyNode) => Math.max(0, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('width', (d: ExtendedSankeyNode) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('fill', (d: ExtendedSankeyNode, i: number) => {
        // Use AICEO color palette based on node index
        return nodeColorMap.get(i) || colors.primary;
      })
      .attr('opacity', 0.8)
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .append('title')
      .text((d: ExtendedSankeyNode) => {
        const value = d.value || 0;
        return `${d.name}\n${formatCurrency(value)}`;
      });

    // Add labels
    node
      .append('text')
      .attr('x', (d: ExtendedSankeyNode) => {
        // Position labels to the left or right based on position
        const x0 = d.x0 ?? 0;
        const x1 = d.x1 ?? 0;
        return x0 < width / 2 ? x0 - 6 : x1 + 6;
      })
      .attr('y', (d: ExtendedSankeyNode) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: ExtendedSankeyNode) => ((d.x0 ?? 0) < width / 2 ? 'end' : 'start'))
      .attr('font-size', '12px')
      .attr('fill', colors.text)
      .text((d: ExtendedSankeyNode) => d.name || '');

    // Add value labels on nodes
    node
      .append('text')
      .attr('x', (d: ExtendedSankeyNode) => {
        const x0 = d.x0 ?? 0;
        const x1 = d.x1 ?? 0;
        return x0 < width / 2 ? x0 - 6 : x1 + 6;
      })
      .attr('y', (d: ExtendedSankeyNode) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2 + 16)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: ExtendedSankeyNode) => ((d.x0 ?? 0) < width / 2 ? 'end' : 'start'))
      .attr('font-size', '10px')
      .attr('fill', colors.textMuted)
      .text((d: ExtendedSankeyNode) => formatCurrency(d.value || 0));
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Income sources flowing to expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Income sources flowing to expenses</CardDescription>
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
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>
          Income sources flowing to expenses (Current Month)
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Total Income: </span>
            <span className="font-semibold text-success">
              {formatCurrency(data.summary.totalIncome)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Expenses: </span>
            <span className="font-semibold text-error">
              {formatCurrency(data.summary.totalExpenses)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Net: </span>
            <span
              className={`font-semibold ${
                data.summary.netCashFlow >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {formatCurrency(data.summary.netCashFlow)}
            </span>
          </div>
          <ChartExportButton
            chartRef={chartWrapperRef}
            filename="cash-flow-sankey"
            data={data.nodes.map((node, idx) => {
              const link = data.links.find(l => l.source === idx || l.target === idx);
              return {
                Node: node.name,
                Value: link?.value || 0,
              };
            })}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartWrapperRef}>
          <div ref={containerRef} className="w-full">
            <svg ref={svgRef} className="w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
