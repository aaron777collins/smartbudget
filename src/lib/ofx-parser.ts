import Ofx from 'node-ofx-parser';

export interface ParsedTransaction {
  date: Date;
  postedDate?: Date;
  description: string;
  merchantName: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  fitid?: string; // OFX unique transaction ID for duplicate detection
  accountNumber?: string;
  balance?: number;
  rawData: Record<string, unknown>;
}

export interface OFXParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  accountInfo?: {
    bankId?: string;
    accountId?: string;
    accountType?: string;
  };
  balance?: {
    amount: number;
    date: Date;
  };
  totalTransactions: number;
  validTransactions: number;
}

/**
 * Extracts merchant name from OFX NAME and MEMO fields
 * OFX NAME is limited to 32 chars, so MEMO often contains the full name
 */
function extractMerchantName(name?: string, memo?: string): string {
  // Combine NAME and MEMO, preferring MEMO if it's longer/more detailed
  let merchantName = '';

  if (memo && memo.trim()) {
    merchantName = memo.trim();
  } else if (name && name.trim()) {
    merchantName = name.trim();
  }

  // If we have both and they're different, combine them
  if (name && memo && name.trim() !== memo.trim()) {
    // Check if memo is just an extension of name
    if (memo.toLowerCase().startsWith(name.toLowerCase())) {
      merchantName = memo.trim();
    } else if (name.toLowerCase().startsWith(memo.toLowerCase())) {
      merchantName = name.trim();
    } else {
      // They're different - concatenate with space
      merchantName = `${name.trim()} ${memo.trim()}`;
    }
  }

  // Clean up common patterns
  merchantName = merchantName
    .replace(/\s+/g, ' ')
    .trim();

  return merchantName || 'Unknown Merchant';
}

/**
 * Determines transaction type based on amount
 */
function determineTransactionType(amount: number, transactionType?: string): 'DEBIT' | 'CREDIT' | 'TRANSFER' {
  // Check OFX TRNTYPE if available
  if (transactionType) {
    const type = transactionType.toUpperCase();
    if (type === 'CREDIT' || type === 'DEP' || type === 'DEPOSIT') return 'CREDIT';
    if (type === 'DEBIT' || type === 'PAYMENT' || type === 'CHECK') return 'DEBIT';
    if (type === 'XFER' || type === 'TRANSFER') return 'TRANSFER';
  }

  // Fallback to amount-based detection
  if (amount < 0) return 'DEBIT';
  if (amount > 0) return 'CREDIT';
  return 'TRANSFER';
}

/**
 * Parses a date from OFX format (YYYYMMDDHHMMSS.XXX[TZ])
 * Example: 20240115120000.000[-5:EST]
 */
function parseOFXDate(dateStr?: string): Date | null {
  if (!dateStr) return null;

  try {
    // OFX dates are in format: YYYYMMDDHHMMSS or YYYYMMDD
    // May include timezone like: 20240115120000.000[-5:EST]
    const cleaned = dateStr.replace(/\[.*\]/, '').split('.')[0];

    if (cleaned.length >= 8) {
      const year = parseInt(cleaned.substring(0, 4));
      const month = parseInt(cleaned.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(cleaned.substring(6, 8));

      // Optional time components
      const hour = cleaned.length >= 10 ? parseInt(cleaned.substring(8, 10)) : 0;
      const minute = cleaned.length >= 12 ? parseInt(cleaned.substring(10, 12)) : 0;
      const second = cleaned.length >= 14 ? parseInt(cleaned.substring(12, 14)) : 0;

      const date = new Date(year, month, day, hour, minute, second);

      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (error) {
    console.error('Error parsing OFX date:', dateStr, error);
  }

  return null;
}

/**
 * Main OFX/QFX parsing function
 */
export async function parseOFX(fileContent: string): Promise<OFXParseResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];
  let accountInfo: OFXParseResult['accountInfo'] | undefined;
  let balance: OFXParseResult['balance'] | undefined;

  return new Promise((resolve) => {
    try {
      // Parse OFX using node-ofx-parser
      Ofx.parse(fileContent, (error: Error | null, ofxData: any) => {
        if (error) {
          resolve({
            success: false,
            transactions: [],
            errors: [`OFX parsing failed: ${error.message}`],
            totalTransactions: 0,
            validTransactions: 0
          });
          return;
        }

        // Validate OFX structure
        if (!ofxData) {
          resolve({
            success: false,
            transactions: [],
            errors: ['Invalid OFX file structure'],
            totalTransactions: 0,
            validTransactions: 0
          });
          return;
        }

        try {
          // Extract account information
          // OFX structure: OFX > [BANKMSGSRSV1|CREDITCARDMSGSRSV1] > [STMTTRNRS|CCSTMTTRNRS] > [STMTRS|CCSTMTRS] > BANKACCTFROM|CCACCTFROM
          const bankMessages = ofxData.body?.OFX?.BANKMSGSRSV1 || ofxData.body?.OFX?.CREDITCARDMSGSRSV1;

          if (!bankMessages) {
            errors.push('No bank or credit card messages found in OFX file');
          } else {
            // Get statement transaction response
            const stmtResponse = bankMessages.STMTTRNRS || bankMessages.CCSTMTTRNRS;

            if (stmtResponse) {
              const statement = stmtResponse.STMTRS || stmtResponse.CCSTMTRS;

              if (statement) {
                // Extract account info
                const accountFrom = statement.BANKACCTFROM || statement.CCACCTFROM;
                if (accountFrom) {
                  accountInfo = {
                    bankId: accountFrom.BANKID,
                    accountId: accountFrom.ACCTID,
                    accountType: accountFrom.ACCTTYPE
                  };
                }

                // Extract balance
                const ledgerBal = statement.LEDGERBAL;
                if (ledgerBal) {
                  const balAmount = parseFloat(ledgerBal.BALAMT);
                  const balDate = parseOFXDate(ledgerBal.DTASOF);

                  if (!isNaN(balAmount) && balDate) {
                    balance = {
                      amount: balAmount,
                      date: balDate
                    };
                  }
                }

                // Extract transactions
                const transactionList = statement.BANKTRANLIST || statement.CCSTMTRS?.BANKTRANLIST;

                if (transactionList && transactionList.STMTTRN) {
                  const stmtTransactions = Array.isArray(transactionList.STMTTRN)
                    ? transactionList.STMTTRN
                    : [transactionList.STMTTRN];

                  for (const txn of stmtTransactions) {
                    try {
                      // Parse date
                      const date = parseOFXDate(txn.DTPOSTED);
                      const userDate = parseOFXDate(txn.DTUSER);

                      // Parse amount
                      const amount = parseFloat(txn.TRNAMT);

                      if (!date || isNaN(amount)) {
                        errors.push(`Skipping transaction with invalid date or amount: ${txn.FITID || 'unknown'}`);
                        continue;
                      }

                      // Extract merchant name from NAME and MEMO
                      const merchantName = extractMerchantName(txn.NAME, txn.MEMO);

                      // Build description (prefer MEMO, fallback to NAME)
                      const description = (txn.MEMO || txn.NAME || 'Unknown Transaction').trim();

                      // Determine transaction type
                      const type = determineTransactionType(amount, txn.TRNTYPE);

                      // Create parsed transaction
                      const transaction: ParsedTransaction = {
                        date,
                        postedDate: date, // DTPOSTED is the posted date
                        description,
                        merchantName,
                        amount,
                        type,
                        fitid: txn.FITID, // Unique ID for duplicate detection
                        accountNumber: accountFrom?.ACCTID,
                        rawData: txn as Record<string, unknown>
                      };

                      // Use DTUSER as the transaction date if available
                      if (userDate) {
                        transaction.date = userDate;
                      }

                      transactions.push(transaction);
                    } catch (txnError) {
                      errors.push(`Error parsing transaction: ${txnError instanceof Error ? txnError.message : String(txnError)}`);
                    }
                  }
                } else {
                  errors.push('No transactions found in OFX file (BANKTRANLIST.STMTTRN missing)');
                }
              } else {
                errors.push('No statement data found (STMTRS/CCSTMTRS missing)');
              }
            } else {
              errors.push('No statement transaction response found (STMTTRNRS/CCSTMTTRNRS missing)');
            }
          }

          // Validate results
          if (transactions.length === 0) {
            errors.push('No valid transactions found in OFX file');
          }

          resolve({
            success: transactions.length > 0,
            transactions,
            errors,
            accountInfo,
            balance,
            totalTransactions: transactions.length,
            validTransactions: transactions.length
          });
        } catch (parseError) {
          resolve({
            success: false,
            transactions: [],
            errors: [`Error processing OFX data: ${parseError instanceof Error ? parseError.message : String(parseError)}`],
            totalTransactions: 0,
            validTransactions: 0
          });
        }
      });
    } catch (error) {
      resolve({
        success: false,
        transactions: [],
        errors: [`Failed to parse OFX file: ${error instanceof Error ? error.message : String(error)}`],
        totalTransactions: 0,
        validTransactions: 0
      });
    }
  });
}

/**
 * Validates an OFX/QFX file before parsing
 */
export function validateOFXFile(file: File): { valid: boolean; error?: string } {
  const fileName = file.name.toLowerCase();

  // Check file type
  if (!fileName.endsWith('.ofx') && !fileName.endsWith('.qfx')) {
    return { valid: false, error: 'File must be an OFX or QFX file' };
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
