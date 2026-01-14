declare module 'node-ofx-parser' {
  interface OfxAccount {
    BANKID?: string;
    ACCTID?: string;
    ACCTTYPE?: string;
  }

  interface OfxBalance {
    BALAMT: string;
    DTASOF: string;
  }

  interface OfxTransaction {
    TRNTYPE?: string;
    DTPOSTED?: string;
    DTUSER?: string;
    TRNAMT: string;
    FITID?: string;
    NAME?: string;
    MEMO?: string;
    [key: string]: any;
  }

  interface OfxTransactionList {
    DTSTART?: string;
    DTEND?: string;
    STMTTRN: OfxTransaction | OfxTransaction[];
  }

  interface OfxStatement {
    CURDEF?: string;
    BANKACCTFROM?: OfxAccount;
    CCACCTFROM?: OfxAccount;
    BANKTRANLIST?: OfxTransactionList;
    CCSTMTRS?: {
      BANKTRANLIST?: OfxTransactionList;
    };
    LEDGERBAL?: OfxBalance;
  }

  interface OfxStatementResponse {
    TRNUID?: string;
    STATUS?: any;
    STMTRS?: OfxStatement;
    CCSTMTRS?: OfxStatement;
  }

  interface OfxBankMessages {
    STMTTRNRS?: OfxStatementResponse;
    CCSTMTTRNRS?: OfxStatementResponse;
  }

  interface OfxBody {
    OFX?: {
      SIGNONMSGSRSV1?: any;
      BANKMSGSRSV1?: OfxBankMessages;
      CREDITCARDMSGSRSV1?: OfxBankMessages;
    };
  }

  interface OfxData {
    header?: string;
    body?: OfxBody;
  }

  function parse(
    ofxContent: string,
    callback: (error: Error | null, data: OfxData) => void
  ): void;

  export { parse };
  export default { parse };
}
