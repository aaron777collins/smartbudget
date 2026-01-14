import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const result = await parseCSV(fileContent);

    // Return parsing result
    return NextResponse.json({
      success: result.success,
      fileName: file.name,
      fileSize: file.size,
      format: result.format,
      totalRows: result.totalRows,
      validRows: result.validRows,
      transactionCount: result.transactions.length,
      transactions: result.transactions,
      errors: result.errors
    });

  } catch (error) {
    console.error('CSV parsing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse CSV file',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
