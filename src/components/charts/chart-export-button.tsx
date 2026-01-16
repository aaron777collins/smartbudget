'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportChart, exportChartData, type ExportFormat } from '@/lib/chart-export';
import { toast } from 'sonner';

export interface ChartExportButtonProps {
  /** Reference to the chart container element */
  chartRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  /** Base filename for the exported file (without extension) */
  filename: string;
  /** Optional chart data for CSV export */
  data?: Record<string, any>[];
  /** Optional CSV column headers */
  csvColumns?: string[];
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Show label or icon only */
  showLabel?: boolean;
}

/**
 * Chart Export Button Component
 *
 * Provides a dropdown menu to export charts in multiple formats:
 * - PNG (high-resolution image)
 * - SVG (vector graphics)
 * - PDF (document)
 * - CSV (data only)
 *
 * @example
 * ```tsx
 * const chartRef = useRef<HTMLDivElement>(null);
 *
 * <div ref={chartRef}>
 *   <SpendingTrendsChart />
 * </div>
 * <ChartExportButton
 *   chartRef={chartRef}
 *   filename="spending-trends"
 *   data={chartData}
 * />
 * ```
 */
export function ChartExportButton({
  chartRef,
  filename,
  data,
  csvColumns,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
}: ChartExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat | 'csv') => {
    if (!chartRef.current && format !== 'csv') {
      toast.error('Chart not available for export');
      return;
    }

    setIsExporting(true);

    try {
      if (format === 'csv') {
        if (!data || data.length === 0) {
          toast.error('No data available for CSV export');
          return;
        }
        exportChartData(data, filename, csvColumns);
        toast.success('Chart data exported as CSV');
      } else {
        await exportChart(chartRef.current!, {
          filename,
          format,
          quality: 0.95,
          backgroundColor: '#ffffff',
        });
        toast.success(`Chart exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chart');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting}
          aria-label="Export chart"
        >
          <Download className="h-4 w-4" />
          {showLabel && <span className="ml-2">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Chart</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <span className="text-sm">PNG Image</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('svg')}>
          <span className="text-sm">SVG Vector</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <span className="text-sm">PDF Document</span>
        </DropdownMenuItem>
        {data && data.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <span className="text-sm">CSV Data</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
