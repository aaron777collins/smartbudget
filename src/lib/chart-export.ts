/**
 * Chart Export Utilities
 *
 * Provides functionality to export charts as PNG, SVG, or PDF
 * Supports both Recharts and D3-based visualizations
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type ExportFormat = 'png' | 'svg' | 'pdf';

export interface ExportOptions {
  /** The filename (without extension) */
  filename: string;
  /** Export format */
  format: ExportFormat;
  /** Quality (0-1) for PNG/JPEG exports */
  quality?: number;
  /** Background color for the exported image */
  backgroundColor?: string;
  /** Width for PDF export (in mm) */
  pdfWidth?: number;
  /** Height for PDF export (in mm) */
  pdfHeight?: number;
}

/**
 * Export a chart element as PNG using html2canvas
 */
async function exportAsPNG(
  element: HTMLElement,
  filename: string,
  options?: { quality?: number; backgroundColor?: string }
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: options?.backgroundColor || '#ffffff',
    scale: 2, // Higher resolution
    logging: false,
    useCORS: true,
  });

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    },
    'image/png',
    options?.quality || 0.95
  );
}

/**
 * Export a chart element as PDF using jsPDF
 */
async function exportAsPDF(
  element: HTMLElement,
  filename: string,
  options?: { pdfWidth?: number; pdfHeight?: number; backgroundColor?: string }
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: options?.backgroundColor || '#ffffff',
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // Default to A4 landscape
  const pdfWidth = options?.pdfWidth || 297; // A4 width in mm (landscape)
  const pdfHeight = options?.pdfHeight || 210; // A4 height in mm (landscape)

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  // Calculate dimensions to fit the image
  const imgWidth = pdfWidth - 20; // 10mm margins on each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}

/**
 * Export an SVG element directly
 */
function exportAsSVG(element: HTMLElement, filename: string): void {
  const svgElement = element.querySelector('svg');

  if (!svgElement) {
    throw new Error('No SVG element found in the provided element');
  }

  // Clone the SVG to avoid modifying the original
  const clonedSVG = svgElement.cloneNode(true) as SVGElement;

  // Add XML namespace if not present
  if (!clonedSVG.getAttribute('xmlns')) {
    clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // Serialize the SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSVG);

  // Create blob and download
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Main export function that handles all formats
 *
 * @param element - The HTML element containing the chart to export
 * @param options - Export options including filename and format
 *
 * @example
 * ```tsx
 * const chartRef = useRef<HTMLDivElement>(null);
 *
 * const handleExport = () => {
 *   if (chartRef.current) {
 *     exportChart(chartRef.current, {
 *       filename: 'spending-trends',
 *       format: 'png',
 *       quality: 0.95,
 *     });
 *   }
 * };
 * ```
 */
export async function exportChart(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename, format, quality, backgroundColor, pdfWidth, pdfHeight } = options;

  try {
    switch (format) {
      case 'png':
        await exportAsPNG(element, filename, { quality, backgroundColor });
        break;
      case 'svg':
        exportAsSVG(element, filename);
        break;
      case 'pdf':
        await exportAsPDF(element, filename, { pdfWidth, pdfHeight, backgroundColor });
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting chart:', error);
    throw error;
  }
}

/**
 * Export chart data as CSV
 *
 * @param data - Array of data objects
 * @param filename - The filename (without extension)
 * @param columns - Optional column headers (if not provided, uses object keys)
 *
 * @example
 * ```tsx
 * exportChartData(
 *   chartData,
 *   'spending-trends',
 *   ['Month', 'Amount', 'Category']
 * );
 * ```
 */
export function exportChartData(
  data: Record<string, any>[],
  filename: string,
  columns?: string[]
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers
  const headers = columns || Object.keys(data[0]);

  // Build CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
