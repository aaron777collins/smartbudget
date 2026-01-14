import Papa from 'papaparse';
import { preprocessMerchantName } from './merchant-normalizer';

export interface ParsedTransaction {
  date: Date;
  postedDate?: Date;
  description: string;
  merchantName: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  accountNumber?: string;
  balance?: number;
  rawData: Record<string, unknown>;
}

export interface CSVParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  format: CSVFormat;
  totalRows: number;
  validRows: number;
}

export enum CSVFormat {
  THREE_COLUMN = '3-column',           // Date, Description, Amount
  FOUR_COLUMN = '4-column',            // Date, Description, Credit, Debit
  FIVE_COLUMN = '5-column',            // Account Number, Date, Description, Amount, Balance
  CIBC_DETAILED = 'cibc-detailed',     // Transaction Date, Posted Date, Description, Amount, etc.
  UNKNOWN = 'unknown'
}

interface CSVRow {
  [key: string]: string;
}

/**
 * Detects the CSV format based on header row and content
 */
function detectCSVFormat(headers: string[], rows: CSVRow[]): CSVFormat {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Check for CIBC detailed format (with Transaction Date and Posted Date)
  if (
    normalizedHeaders.some(h => h.includes('transaction date') || h.includes('trans date')) &&
    normalizedHeaders.some(h => h.includes('posted date'))
  ) {
    return CSVFormat.CIBC_DETAILED;
  }

  // Check for 5-column format (Account Number, Date, Description, Amount, Balance)
  if (normalizedHeaders.length >= 5 &&
      normalizedHeaders.some(h => h.includes('account')) &&
      normalizedHeaders.some(h => h.includes('balance'))) {
    return CSVFormat.FIVE_COLUMN;
  }

  // Check for 4-column format (Date, Description, Credit, Debit)
  if (normalizedHeaders.length >= 4 &&
      normalizedHeaders.some(h => h.includes('credit')) &&
      normalizedHeaders.some(h => h.includes('debit'))) {
    return CSVFormat.FOUR_COLUMN;
  }

  // Check for 3-column format (Date, Description, Amount)
  if (normalizedHeaders.length >= 3 &&
      normalizedHeaders.some(h => h.includes('date')) &&
      normalizedHeaders.some(h => h.includes('description') || h.includes('merchant')) &&
      normalizedHeaders.some(h => h.includes('amount'))) {
    return CSVFormat.THREE_COLUMN;
  }

  return CSVFormat.UNKNOWN;
}

/**
 * Parses a date string with multiple format support
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleaned = dateStr.trim();

  // Try various date formats
  const formats = [
    // ISO format: 2024-01-15
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY or D/M/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  ];

  // Try parsing as ISO string first
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try MM/DD/YYYY format
  const mmddyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD-MM-YYYY or DD/MM/YYYY (assume day first if > 12)
  const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, first, second, year] = ddmmyyyyMatch;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);

    // If first number is > 12, it must be day
    if (firstNum > 12) {
      const date = new Date(parseInt(year), secondNum - 1, firstNum);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Parses an amount string and returns a number
 * Handles: "$1,234.56", "-$1,234.56", "1234.56", "(1234.56)"
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;

  const cleaned = amountStr.trim();

  // Remove currency symbols, commas, and whitespace
  let numStr = cleaned
    .replace(/[\$,\s]/g, '')
    .trim();

  // Handle parentheses as negative (accounting format)
  if (numStr.startsWith('(') && numStr.endsWith(')')) {
    numStr = '-' + numStr.slice(1, -1);
  }

  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

/**
 * Extracts merchant name from description
 * Uses merchant normalization pipeline for consistent names
 */
function extractMerchantName(description: string): string {
  // Use the merchant normalization pipeline for consistent preprocessing
  return preprocessMerchantName(description);
}

/**
 * Determines transaction type based on amount
 */
function determineTransactionType(amount: number): 'DEBIT' | 'CREDIT' | 'TRANSFER' {
  if (amount < 0) return 'DEBIT';
  if (amount > 0) return 'CREDIT';
  return 'TRANSFER'; // Zero amount
}

/**
 * Parses 3-column CSV format: Date, Description, Amount
 */
function parseThreeColumnFormat(rows: CSVRow[], headers: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Find column indices
  const dateIdx = normalizedHeaders.findIndex(h => h.includes('date'));
  const descIdx = normalizedHeaders.findIndex(h => h.includes('description') || h.includes('merchant'));
  const amountIdx = normalizedHeaders.findIndex(h => h.includes('amount'));

  for (const row of rows) {
    const dateStr = row[headers[dateIdx]];
    const description = row[headers[descIdx]];
    const amountStr = row[headers[amountIdx]];

    const date = parseDate(dateStr);
    const amount = parseAmount(amountStr);

    if (date && amount !== null && description) {
      transactions.push({
        date,
        description: description.trim(),
        merchantName: extractMerchantName(description),
        amount,
        type: determineTransactionType(amount),
        rawData: row as Record<string, unknown>
      });
    }
  }

  return transactions;
}

/**
 * Parses 4-column CSV format: Date, Description, Credit, Debit
 */
function parseFourColumnFormat(rows: CSVRow[], headers: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Find column indices
  const dateIdx = normalizedHeaders.findIndex(h => h.includes('date'));
  const descIdx = normalizedHeaders.findIndex(h => h.includes('description') || h.includes('merchant'));
  const creditIdx = normalizedHeaders.findIndex(h => h.includes('credit'));
  const debitIdx = normalizedHeaders.findIndex(h => h.includes('debit'));

  for (const row of rows) {
    const dateStr = row[headers[dateIdx]];
    const description = row[headers[descIdx]];
    const creditStr = row[headers[creditIdx]];
    const debitStr = row[headers[debitIdx]];

    const date = parseDate(dateStr);
    const credit = parseAmount(creditStr);
    const debit = parseAmount(debitStr);

    // Determine amount and type
    let amount = 0;
    let type: 'DEBIT' | 'CREDIT' | 'TRANSFER' = 'TRANSFER';

    if (credit !== null && credit !== 0) {
      amount = credit;
      type = 'CREDIT';
    } else if (debit !== null && debit !== 0) {
      amount = -Math.abs(debit); // Debits are negative
      type = 'DEBIT';
    }

    if (date && description) {
      transactions.push({
        date,
        description: description.trim(),
        merchantName: extractMerchantName(description),
        amount,
        type,
        rawData: row as Record<string, unknown>
      });
    }
  }

  return transactions;
}

/**
 * Parses 5-column CSV format: Account Number, Date, Description, Amount, Balance
 */
function parseFiveColumnFormat(rows: CSVRow[], headers: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Find column indices
  const accountIdx = normalizedHeaders.findIndex(h => h.includes('account'));
  const dateIdx = normalizedHeaders.findIndex(h => h.includes('date'));
  const descIdx = normalizedHeaders.findIndex(h => h.includes('description') || h.includes('merchant'));
  const amountIdx = normalizedHeaders.findIndex(h => h.includes('amount'));
  const balanceIdx = normalizedHeaders.findIndex(h => h.includes('balance'));

  for (const row of rows) {
    const accountNumber = row[headers[accountIdx]];
    const dateStr = row[headers[dateIdx]];
    const description = row[headers[descIdx]];
    const amountStr = row[headers[amountIdx]];
    const balanceStr = row[headers[balanceIdx]];

    const date = parseDate(dateStr);
    const amount = parseAmount(amountStr);
    const balance = parseAmount(balanceStr);

    if (date && amount !== null && description) {
      transactions.push({
        date,
        description: description.trim(),
        merchantName: extractMerchantName(description),
        amount,
        type: determineTransactionType(amount),
        accountNumber: accountNumber?.trim(),
        balance: balance !== null ? balance : undefined,
        rawData: row as Record<string, unknown>
      });
    }
  }

  return transactions;
}

/**
 * Parses CIBC detailed format: Transaction Date, Posted Date, Description, Amount
 */
function parseCIBCDetailedFormat(rows: CSVRow[], headers: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Find column indices
  const transDateIdx = normalizedHeaders.findIndex(h => h.includes('transaction date') || h.includes('trans date'));
  const postedDateIdx = normalizedHeaders.findIndex(h => h.includes('posted date'));
  const descIdx = normalizedHeaders.findIndex(h => h.includes('description') || h.includes('merchant'));
  const amountIdx = normalizedHeaders.findIndex(h => h.includes('amount'));

  for (const row of rows) {
    const transDateStr = row[headers[transDateIdx]];
    const postedDateStr = row[headers[postedDateIdx]];
    const description = row[headers[descIdx]];
    const amountStr = row[headers[amountIdx]];

    const date = parseDate(transDateStr);
    const postedDate = parseDate(postedDateStr);
    const amount = parseAmount(amountStr);

    if (date && amount !== null && description) {
      transactions.push({
        date,
        postedDate: postedDate || undefined,
        description: description.trim(),
        merchantName: extractMerchantName(description),
        amount,
        type: determineTransactionType(amount),
        rawData: row as Record<string, unknown>
      });
    }
  }

  return transactions;
}

/**
 * Main CSV parsing function
 */
export async function parseCSV(fileContent: string): Promise<CSVParseResult> {
  const errors: string[] = [];

  return new Promise((resolve) => {
    Papa.parse<CSVRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings for custom parsing
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const { data, errors: parseErrors, meta } = results;

        // Add any parsing errors
        if (parseErrors.length > 0) {
          errors.push(...parseErrors.map(e => e.message));
        }

        // Get headers
        const headers = meta.fields || [];

        if (headers.length === 0) {
          resolve({
            success: false,
            transactions: [],
            errors: ['No headers found in CSV file'],
            format: CSVFormat.UNKNOWN,
            totalRows: 0,
            validRows: 0
          });
          return;
        }

        // Detect format
        const format = detectCSVFormat(headers, data);

        if (format === CSVFormat.UNKNOWN) {
          resolve({
            success: false,
            transactions: [],
            errors: ['Unable to detect CSV format. Please ensure the file has headers like: Date, Description, Amount'],
            format: CSVFormat.UNKNOWN,
            totalRows: data.length,
            validRows: 0
          });
          return;
        }

        // Parse based on detected format
        let transactions: ParsedTransaction[] = [];

        try {
          switch (format) {
            case CSVFormat.THREE_COLUMN:
              transactions = parseThreeColumnFormat(data, headers);
              break;
            case CSVFormat.FOUR_COLUMN:
              transactions = parseFourColumnFormat(data, headers);
              break;
            case CSVFormat.FIVE_COLUMN:
              transactions = parseFiveColumnFormat(data, headers);
              break;
            case CSVFormat.CIBC_DETAILED:
              transactions = parseCIBCDetailedFormat(data, headers);
              break;
          }
        } catch (error) {
          errors.push(`Error parsing transactions: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Validate that we parsed some transactions
        if (transactions.length === 0) {
          errors.push('No valid transactions found in CSV file');
        }

        resolve({
          success: transactions.length > 0 && errors.length === 0,
          transactions,
          errors,
          format,
          totalRows: data.length,
          validRows: transactions.length
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          transactions: [],
          errors: [`CSV parsing failed: ${error.message}`],
          format: CSVFormat.UNKNOWN,
          totalRows: 0,
          validRows: 0
        });
      }
    });
  });
}

/**
 * Validates a CSV file before parsing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}
