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

    // Update all files to processing status
    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: "processing" as const }))
    );

    // Simulate processing (in real implementation, this would call API endpoints)
    // For now, we'll just simulate success after a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update files to success status with mock data
    setUploadedFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "success" as const,
        previewData: {
          transactionCount: Math.floor(Math.random() * 100) + 1,
        },
      }))
    );

    setIsProcessing(false);
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
                  <Button onClick={() => alert("Import functionality coming soon!")}>
                    Import Transactions
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
