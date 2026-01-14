"use client";

import { useState } from "react";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Upload, FileText, Database, CheckCircle } from "lucide-react";

export default function ImportPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: "pending",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);

    // Process each file
    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploadedFile = uploadedFiles[i];

      // Skip already processed files
      if (uploadedFile.status === "success") continue;

      // Update this specific file to processing
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "processing" as const } : f
        )
      );

      try {
        const file = uploadedFile.file;
        const fileExtension = file.name.toLowerCase().split('.').pop();

        // Handle CSV files
        if (fileExtension === 'csv') {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/import/parse-csv', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Success - update file with parsed data
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: "success" as const,
                      previewData: {
                        transactionCount: result.transactionCount,
                        format: result.format,
                        transactions: result.transactions,
                        validRows: result.validRows,
                        totalRows: result.totalRows,
                      },
                    }
                  : f
              )
            );
          } else {
            // Error - update file with error message
            const errorMessage = result.errors?.join(', ') || result.error || 'Failed to parse CSV';
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: "error" as const,
                      error: errorMessage,
                    }
                  : f
              )
            );
          }
        } else if (fileExtension === 'ofx' || fileExtension === 'qfx') {
          // Handle OFX/QFX files
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/import/parse-ofx', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Success - update file with parsed data
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: "success" as const,
                      previewData: {
                        transactionCount: result.validTransactions,
                        format: 'OFX/QFX',
                        transactions: result.transactions,
                        validRows: result.validTransactions,
                        totalRows: result.totalTransactions,
                        accountInfo: result.accountInfo,
                        balance: result.balance,
                      },
                    }
                  : f
              )
            );
          } else {
            // Error - update file with error message
            const errorMessage = result.errors?.join(', ') || result.error || 'Failed to parse OFX/QFX';
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: "error" as const,
                      error: errorMessage,
                    }
                  : f
              )
            );
          }
        } else {
          // Unsupported file type
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? {
                    ...f,
                    status: "error" as const,
                    error: "Unsupported file type",
                  }
                : f
            )
          );
        }
      } catch (error) {
        // Network or other error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : 'Failed to process file',
                }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleImportTransactions = async () => {
    if (!allProcessed) return;

    try {
      setIsProcessing(true);

      // Import each file's transactions
      for (const uploadedFile of uploadedFiles.filter(f => f.status === "success")) {
        if (!uploadedFile.previewData?.transactions) continue;

        const response = await fetch('/api/transactions/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: uploadedFile.previewData.transactions,
            accountInfo: uploadedFile.previewData.accountInfo ? {
              name: uploadedFile.previewData.accountInfo.accountName || 'Imported Account',
              institution: uploadedFile.previewData.accountInfo.bankName || 'CIBC',
              accountType: uploadedFile.previewData.accountInfo.accountType || 'CHECKING',
              accountNumber: uploadedFile.previewData.accountInfo.accountNumber || 'Unknown',
              currency: uploadedFile.previewData.accountInfo.currency || 'CAD',
            } : undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to import transactions');
        }

        // Log categorization stats
        if (result.categorizedCount > 0) {
          console.log(`Auto-categorized ${result.categorizedCount} of ${result.importedCount} transactions`);
        }
      }

      // Success! Show message and redirect
      alert(`Successfully imported ${totalTransactions} transactions! Auto-categorization applied where possible.`);
      // Redirect to transactions page
      window.location.href = '/transactions';
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Failed to import transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalTransactions = uploadedFiles.reduce(
    (acc, file) => acc + (file.previewData?.transactionCount || 0),
    0
  );

  const canProcess =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.status !== "processing") &&
    !isProcessing;

  const allProcessed =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.status === "success");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your bank statements to automatically import and categorize transactions
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Supported File Formats</AlertTitle>
        <AlertDescription>
          You can upload CSV, OFX, or QFX files exported from your bank. Files will be validated
          and you'll see a preview before importing.
        </AlertDescription>
      </Alert>

      {/* Import Process Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">1. Upload Files</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop or select files from your computer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">2. Validate & Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review parsed transactions and fix any issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">3. Import</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save transactions and automatically categorize them
            </p>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Component */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Select one or more files to import. You can upload up to 10 files at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            uploadedFiles={uploadedFiles}
            maxFiles={10}
            maxSize={10 * 1024 * 1024}
          />

          {/* Action Buttons */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {allProcessed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Ready to import {totalTransactions} transactions from {uploadedFiles.length}{" "}
                      file(s)
                    </span>
                  </div>
                ) : (
                  <span>
                    {uploadedFiles.length} file(s) selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadedFiles([])}
                  disabled={isProcessing}
                >
                  Clear All
                </Button>
                {!allProcessed ? (
                  <Button
                    onClick={handleProcessFiles}
                    disabled={!canProcess}
                  >
                    Process Files
                  </Button>
                ) : (
                  <Button onClick={handleImportTransactions} disabled={isProcessing}>
                    {isProcessing ? 'Importing...' : 'Import Transactions'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">How to export from CIBC:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Log in to CIBC Online Banking</li>
              <li>Go to Account Activity for the account you want to export</li>
              <li>Select the date range and click "Download"</li>
              <li>Choose CSV, OFX, or QFX format</li>
              <li>Upload the downloaded file here</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium mb-2">Supported formats:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li><strong>CSV:</strong> Standard 3-column (Date, Description, Amount) or 4-column (Date, Description, Credit, Debit)</li>
              <li><strong>OFX/QFX:</strong> Open Financial Exchange format with transaction details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
