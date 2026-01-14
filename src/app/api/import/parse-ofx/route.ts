import { NextRequest, NextResponse } from 'next/server';
import { parseOFX, validateOFXFile } from '@/lib/ofx-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateOFXFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse OFX
    const result = await parseOFX(fileContent);

    return NextResponse.json({
      success: result.success,
      transactions: result.transactions,
      errors: result.errors,
      accountInfo: result.accountInfo,
      balance: result.balance,
      totalTransactions: result.totalTransactions,
      validTransactions: result.validTransactions
    });
  } catch (error) {
    console.error('Error parsing OFX file:', error);
    return NextResponse.json(
      { error: `Failed to parse OFX file: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
